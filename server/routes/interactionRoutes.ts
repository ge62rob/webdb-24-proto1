import { Router } from 'express';
import { pool } from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

/**
 * POST /api/interactions/analyze
 * body: { drugIds: string[] }
 * 对每两种drug配对查询数据库，如无记录则调用OpenAI写库
 */
router.post('/analyze', async (req, res) => {
  try {
    const { drugIds } = req.body; 
    if (!Array.isArray(drugIds) || drugIds.length < 2) {
      return res.status(400).json({ error: 'At least two drug IDs are required for interaction analysis.' });
    }

    // 1) 生成两两配对
    const pairs = generatePairs(drugIds);
    interface InteractionResult {
      drug1_id: string;
      drug2_id: string;
      drug1_name: string;
      drug2_name: string;
      summary: string;
      details: string;
      risk_rating: string;
    }
    
    const results: InteractionResult[] = [];

    for (const [id1, id2] of pairs) {
      // 固定顺序, 避免 (B, C) / (C, B) 重复
      const [d1, d2] = sortDrugIds(id1, id2);

      // 2) 查询数据库
      const checkRes = await pool.query(
        `SELECT dip.*, d1.name as drug1_name, d2.name as drug2_name
         FROM drug_interaction_pairs dip
         JOIN drugs d1 ON dip.drug1_id = d1.id
         JOIN drugs d2 ON dip.drug2_id = d2.id
         WHERE dip.drug1_id = $1 AND dip.drug2_id = $2
         LIMIT 1
        `, [d1, d2]
      );

      if (checkRes.rowCount && checkRes.rowCount > 0) {
        // 已存在记录
        const row = checkRes.rows[0];
        results.push({
          drug1_id: d1,
          drug2_id: d2,
          drug1_name: row.drug1_name,
          drug2_name: row.drug2_name,
          summary: row.summary,
          details: row.details,
          risk_rating: row.risk_rating || 'Unknown',
        });
      } else {
        // 不存在 => 调用 GPT
        const { summary, details, rating } = await callOpenAIForPair(d1, d2);

        // 插入数据库
        const newId = uuidv4();
        await pool.query(
          `INSERT INTO drug_interaction_pairs
             (id, drug1_id, drug2_id, summary, details, risk_rating, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          `,
          [newId, d1, d2, summary, details, rating]
        );

        const [drug1Name, drug2Name] = await getDrugNamesByIds([d1, d2]);
        results.push({
          drug1_id: d1,
          drug2_id: d2,
          drug1_name: drug1Name,
          drug2_name: drug2Name,
          summary,
          details,
          risk_rating: rating,
        });
      }
    }

    // 最终返回，保持原有结构
    return res.json({
      pairs: results.map(pair => ({
        drug1_name: pair.drug1_name,
        drug2_name: pair.drug2_name,
        summary: pair.summary,
        details: pair.details,
        risk_rating: pair.risk_rating
      }))
    });
  } catch (error) {
    console.error('Analyze interactions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** 生成两两配对 */
function generatePairs(ids: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      pairs.push([ids[i], ids[j]]);
    }
  }
  return pairs;
}

/** 保持 drug1_id < drug2_id，以防重复 */
function sortDrugIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** 调用 OpenAI GPT，分析两种药物 */
async function callOpenAIForPair(drugId1: string, drugId2: string): Promise<{
  summary: string;
  details: string;
  rating: string;
}> {
  // 先通过 drugId 查 drug name
  const [name1, name2] = await getDrugNamesByIds([drugId1, drugId2]);

  // 构造提示
  const prompt = `You are a highly knowledgeable pharmacology expert.
Analyze the following two drugs for potential interactions or cross-reactions:
1) ${name1}
2) ${name2}

Please respond in JSON format with the following fields:
{
  "summary": "A short summary of the interaction",
  "rating": "One of: 'Safe', 'Warning', or 'Prohibited'",
  "details": "Additional explanation and usage considerations"
}

Use the following guidelines to decide the 'rating':
- "Safe": The interaction poses minimal clinical risk.
  Any potential side effects are mild enough that most patients could tolerate them without significant medical intervention.
  Examples: Mild GI discomfort, slight headache, or minor fatigue that typically resolves without seeing a doctor.
  
- "Warning": The interaction is moderate and may cause notable symptoms or complications that could seriously affect quality of life if not addressed.
  Seeking medical advice is recommended, but this combination is not necessarily life-threatening if monitored properly.
  Examples: Moderate GI bleeding risk, potential for organ function compromise that requires medical follow-up, or severe allergic reaction (but manageable with timely intervention).
  
- "Prohibited": The interaction is severe or potentially life-threatening.
  Using these two drugs together could lead to hospitalization or result in permanent damage, significant disability, or even death.
  Examples: Drugs that cause fatal cardiac arrhythmias, major organ failure, or extremely high hemorrhage risk when combined.

Important:
- Return a valid JSON object with no additional text or code fencing.
- Do not wrap the JSON in triple backticks or any Markdown code block.
- Do not include any extra keys or text outside the JSON object.
- Keep your response concise and strictly follow the above format.`;

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY || '';
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let raw = response.data.choices?.[0]?.message?.content || '';
    // 去除 Markdown 代码块
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      console.error('JSON parse error:', error);
      parsed = { summary: raw, rating: 'Unknown', details: '' };
    }

    return {
      summary: parsed.summary || '',
      details: parsed.details || '',
      rating: parsed.rating || 'Unknown'
    };
  } catch (error: unknown) {
    const err = error as Error & { response?: { data?: unknown } };
    console.error('Deepseek error:', err.response?.data);
    throw new Error('Failed to analyze drug interaction via Deepseek');
  }
}

/** 根据 drug_id 获取对应药物 name */
async function getDrugNamesByIds(ids: string[]): Promise<string[]> {
  const query = `SELECT id, name FROM drugs WHERE id = ANY($1)`;
  const result = await pool.query(query, [ids]);
  const map: { [id: string]: string } = {};
  for (const row of result.rows) {
    map[row.id] = row.name;
  }
  // 保持输入顺序输出
  return ids.map(id => map[id] || 'Unknown Drug');
}

export default router;
