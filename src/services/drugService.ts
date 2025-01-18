import { Drug } from '../types';
import { fetchDrugData, analyzeDrugInteractions } from './api';

/**
 * Search for drugs by brand name.
 * @param drugName The search term (brand name).
 * @returns A Promise that resolves to an array of Drug objects.
 */
export async function searchDrugs(drugName: string): Promise<Drug[]> {
    const { data } = await fetchDrugData(drugName);
    // 后端返回的 data 字段里包含所有 Drug 信息
    // 为了与前端定义的 Drug[] 类型保持一致，可以做些格式转换
    return [data];
}

/**
 * Analyze cross-reactions between drugs using OpenAI API.
 * @param drugIds An array of Drug objects.
 * @returns A Promise that resolves to a string containing the analysis.
 */
// 分析相互作用：假设我们需要传 drugId 列表给后端
interface AnalysisResult {
  drug1_name: string;
  drug2_name: string;
  summary: string;
  details: string;
  risk_rating: string;
}

export async function getDrugInteractionAnalysis(drugIds: string[]): Promise<AnalysisResult[]> {
    // 调用 analyzeDrugInteractions
    const { pairs } = await analyzeDrugInteractions(drugIds);
    // pairs 形如 [{ drug1_id, drug2_id, analysis_text }, ...]
    // 前端可以自己把它拼接成一段文字，或返回 JSON 自行渲染
    // 这里仅示例：简单把各对 analysis_text 拼在一起
    interface Pair {
      drug1_id: string;
      drug2_id: string;
      drug1_name: string;
      drug2_name: string;
      summary: string;
      details: string;
      risk_rating: string;
    }
    
    return (pairs as Pair[]).map((p: Pair): AnalysisResult => ({
      drug1_name: p.drug1_name,
      drug2_name: p.drug2_name,
      summary: p.summary || '',
      details: p.details || '',
      risk_rating: p.risk_rating || 'Unknown'
    }));
}

/**
 * Extracts specific details about a single drug.
 * @param drug The Drug object.
 * @returns A string summarizing the drug details.
 */
export function getDrugSummary(drug: Drug): string {
  return `
    Name: ${drug.name}
    Category: ${drug.category}
    Indications: ${drug.indications.join(', ') || 'Not specified'}
    Warnings: ${drug.warnings.join(', ') || 'No major warnings'}
    Mechanism of Action: ${drug.mechanismOfAction || 'Not available'}
    Dosage: ${drug.dosage || 'Consult with a healthcare provider'}
  `;
}
