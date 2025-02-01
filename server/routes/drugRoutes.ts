// 文件路径：webdb-24-proto1/server/routes/drugRoutes.ts
import { Router } from 'express';
import { pool } from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const router = Router();

/**
 * GET /api/drugs/search?name=xxx
 * 查询药物，如果数据库没有则调用FDA API并写入
 */
router.get('/search', async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'Missing query parameter: name' });
  }

  const startTime = Date.now();
  const drugName = String(name).trim().toLowerCase();

  try {
    // 1) 数据库查询
    const dbResult = await pool.query(`
      SELECT d.*, dd.indications, dd.warnings, dd.mechanism_of_action, dd.dosage, dd.contraindications, dd.raw_data
      FROM drugs d
      JOIN drug_details dd ON d.id = dd.drug_id
      WHERE LOWER(TRIM(d.name)) LIKE '%' || $1 || '%'`, [drugName]);

    if (dbResult.rowCount && dbResult.rowCount > 0) {
      // 命中缓存
      const drug = dbResult.rows[0];

      // 更新 last_queried
      await pool.query(`UPDATE drugs SET last_queried = NOW() WHERE id = $1`, [drug.id]);

      // 记录日志
      const logId = uuidv4();
      await pool.query(`
        INSERT INTO query_logs (id, drug_id, hit_cache, response_time) 
        VALUES ($1, $2, $3, $4)
      `, [logId, drug.id, true, Date.now() - startTime]);

      return res.json({
        hitCache: true,
        data: transformDrugRecord(drug),
      });
    } else {
      // 未命中缓存 => 调用 FDA API
      const apiUrl = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${drugName}&limit=1`;
      try {
        const response = await axios.get(apiUrl);
        if (!response.data.results || response.data.results.length === 0) {
          return res.status(404).json({ error: 'No data found from FDA API' });
        }

        const apiDrug = response.data.results[0];
        const newDrugId = uuidv4();

        // 提取字段
        const drugRecord = {
          id: newDrugId,
          name: apiDrug.openfda?.brand_name?.[0] || drugName,
          category: apiDrug.openfda?.product_type?.[0] || 'Unknown',
          source: 'FDA API',
        };

        const detailsRecord = {
          id: uuidv4(),
          drug_id: newDrugId,
          indications: apiDrug.indications_and_usage || [],
          warnings: apiDrug.warnings || [],
          mechanism_of_action: apiDrug.clinical_pharmacology?.join('\n') || '',
          dosage: apiDrug.dosage_and_administration?.join('\n') || '',
          contraindications: apiDrug.contraindications || [],
          raw_data: apiDrug,
        };

        // 插入数据
        await pool.query(`
          INSERT INTO drugs (id, name, category, source, created_at, updated_at, last_queried)
          VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
        `, [drugRecord.id, drugRecord.name, drugRecord.category, drugRecord.source]);

        await pool.query(`
          INSERT INTO drug_details (
            id, drug_id, indications, warnings, mechanism_of_action, dosage, contraindications, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          detailsRecord.id,
          detailsRecord.drug_id,
          JSON.stringify(detailsRecord.indications),
          JSON.stringify(detailsRecord.warnings),
          detailsRecord.mechanism_of_action,
          detailsRecord.dosage,
          JSON.stringify(detailsRecord.contraindications),
          JSON.stringify(detailsRecord.raw_data),
        ]);

        // 记录日志
        const logId = uuidv4();
        await pool.query(`
          INSERT INTO query_logs (id, drug_id, hit_cache, response_time) 
          VALUES ($1, $2, $3, $4)
        `, [logId, newDrugId, false, Date.now() - startTime]);

        // 返回结果
        return res.json({
          hitCache: false,
          data: {
            id: drugRecord.id,
            name: drugRecord.name,
            category: drugRecord.category,
            indications: detailsRecord.indications,
            warnings: detailsRecord.warnings,
            mechanismOfAction: detailsRecord.mechanism_of_action,
            dosage: detailsRecord.dosage,
            contraindications: detailsRecord.contraindications,
          },
        });
      } catch (apiError) {
        // 修复 TS18046 错误
        if (apiError instanceof Error) {
          console.error('FDA API error:', apiError.message);
          return res.status(500).json({ error: 'FDA API error', details: apiError.message });
        } else {
          console.error('FDA API error:', apiError);
          return res.status(500).json({ error: 'FDA API error', details: 'Unknown error' });
        }
      }
    }
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** 将数据库记录转换为前端所需结构 */
function transformDrugRecord(dbRow: any) {
  return {
    id: dbRow.id,
    name: dbRow.name,
    category: dbRow.category,
    indications: dbRow.indications || [],
    warnings: dbRow.warnings || [],
    mechanismOfAction: dbRow.mechanism_of_action || '',
    dosage: dbRow.dosage || '',
    contraindications: dbRow.contraindications || [],
  };
}

/**
 * 自动补全接口
 * GET /api/drugs/autocomplete?prefix=xxx
 * 返回一个字符串数组，表示匹配到的药品名称
 */
router.get('/autocomplete', async (req, res) => {
  const prefix = (req.query.prefix || '').toString().toLowerCase();

  // 如果没有 prefix，则直接返回空数组
  if (!prefix) {
    return res.json([]);
  }

  try {
    // 用SQL做前缀匹配 (name LIKE prefix%)
    // 这里ORDER BY可选，LIMIT 10只拿前10个候选
    const sql = `
      SELECT name
      FROM drugs
      WHERE LOWER(name) LIKE '%' || $1 || '%'
      ORDER BY name
      LIMIT 10
    `;
    const result = await pool.query(sql, [ prefix ])

    // rows 形如 [ { name: 'aspirin' }, { name: 'amoxicillin' }, ... ]
    const drugNames = result.rows.map(r => r.name);

    return res.json(drugNames);
  } catch (error) {
    console.error('Autocomplete error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
