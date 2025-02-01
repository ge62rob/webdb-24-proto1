import { Drug } from '../types';
import { fetchDrugData, analyzeDrugInteractions } from './api';

/**
 * Search for drugs by brand name.
 * @param drugName The search term (brand name).
 * @returns A Promise that resolves to an array of Drug objects.
 */
export async function searchDrugs(drugName: string): Promise<Drug[]> {
    const { data } = await fetchDrugData(drugName);
    // The data field returned by the backend contains all Drug information
    // To maintain consistency with the frontend-defined Drug[] type, some format conversion can be done
    return [data];
}

/**
 * Analyze cross-reactions between drugs using OpenAI API.
 * @param drugIds An array of Drug objects.
 * @returns A Promise that resolves to a string containing the analysis.
 */
// Analyze interactions: assuming we need to pass a list of drug IDs to the backend
interface AnalysisResult {
  drug1_name: string;
  drug2_name: string;
  summary: string;
  details: string;
  risk_rating: string;
}

export async function getDrugInteractionAnalysis(drugIds: string[]): Promise<AnalysisResult[]> {
    // Call analyzeDrugInteractions
    const { pairs } = await analyzeDrugInteractions(drugIds);
    // pairs are in the form of [{ drug1_id, drug2_id, analysis_text }, ...]
    // The frontend can concatenate it into a piece of text itself, or return JSON for rendering
    // Here is an example: simply concatenate the analysis_text of each pair
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
