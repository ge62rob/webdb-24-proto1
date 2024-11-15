import React, { useState } from 'react';
import { Pill } from 'lucide-react';
import { DrugInput } from './components/DrugInput';
import { DrugCard } from './components/DrugCard';
import { InteractionPanel } from './components/InteractionPanel';
import { PrescriptionInfo } from './components/PrescriptionInfo';
import { Drug } from './types';

export default function App() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [activeDrug, setActiveDrug] = useState<Drug | null>(null);

  const addDrug = (drug: Drug) => {
    if (!drugs.find((d) => d.id === drug.id)) {
      setDrugs([...drugs, drug]);
      setActiveDrug(drug);
    }
  };

  const removeDrug = (id: string) => {
    setDrugs(drugs.filter((drug) => drug.id !== id));
    if (activeDrug?.id === id) {
      setActiveDrug(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          <Pill className="h-8 w-8 text-indigo-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-800">Drug Information System</h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <DrugInput onAddDrug={addDrug} />
              <div className="grid sm:grid-cols-1 gap-4">
                {drugs.map((drug) => (
                  <DrugCard
                    key={drug.id}
                    drug={drug}
                    onSelect={(d) => setActiveDrug(d)}
                    onRemove={removeDrug}
                  />
                ))}
              </div>
              {drugs.length >= 2 && <InteractionPanel drugs={drugs} />}
            </div>
          </div>

          <div className="lg:col-span-3">
            <PrescriptionInfo drug={activeDrug} />
          </div>
        </div>
      </div>
    </div>
  );
}
