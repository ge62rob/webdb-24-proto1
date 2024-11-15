import { Drug } from '../types';
import { fetchDrugData, analyzeDrugInteractions } from './api';

/**
 * Search for drugs by brand name.
 * @param query The search term (brand name).
 * @returns A Promise that resolves to an array of Drug objects.
 */
export async function searchDrugs(query: string): Promise<Drug[]> {
  try {
    const drugs = await fetchDrugData(query);
    return drugs;
  } catch (error) {
    console.error('Error searching drugs:', error);
    throw new Error('Failed to search medications. Please try again.');
  }
}

/**
 * Analyze cross-reactions between drugs using OpenAI API.
 * @param drugs An array of Drug objects.
 * @returns A Promise that resolves to a string containing the analysis.
 */
export async function getDrugInteractionAnalysis(drugs: Drug[]): Promise<string> {
  const drugNames = drugs.map((drug) => drug.name);

  try {
    return await analyzeDrugInteractions(drugNames);
  } catch (error) {
    console.error('Error in getDrugInteractionAnalysis:', error);
    throw new Error('Failed to analyze drug interactions. Please try again.');
  }
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
