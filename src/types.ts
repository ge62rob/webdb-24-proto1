export interface Drug {
  id: string;
  name: string;
  category: string;
  indications: string[];
  warnings: string[];
  mechanismOfAction: string;
  dosage: string;
  contraindications: string[];
}
