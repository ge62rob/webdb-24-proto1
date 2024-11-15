import { Drug, Interaction } from '../types';

export function generateCombinations(drugs: Drug[]): [Drug, Drug][] {
  const combinations: [Drug, Drug][] = [];
  for (let i = 0; i < drugs.length; i++) {
    for (let j = i + 1; j < drugs.length; j++) {
      combinations.push([drugs[i], drugs[j]]);
    }
  }
  return combinations;
}

export function findInteractions(drugPair: [Drug, Drug], knownInteractions: Interaction[]): Interaction | null {
  return knownInteractions.find(interaction => {
    const drugs = new Set(interaction.drugs.map(d => d.toLowerCase()));
    return drugs.has(drugPair[0].name.toLowerCase()) && drugs.has(drugPair[1].name.toLowerCase());
  }) || null;
}