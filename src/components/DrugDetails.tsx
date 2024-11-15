import React from 'react';
import { X } from 'lucide-react';
import { Drug } from '../types';

interface DrugDetailsProps {
  drug: Drug;
  onClose: () => void;
}

export function DrugDetails({ drug, onClose }: DrugDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{drug.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {drug.indications && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Indications</h3>
              <ul className="list-disc list-inside space-y-1">
                {drug.indications.map((indication, index) => (
                  <li key={index} className="text-gray-700">{indication}</li>
                ))}
              </ul>
            </section>
          )}

          {drug.warnings && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Warnings</h3>
              <ul className="list-disc list-inside space-y-1">
                {drug.warnings.map((warning, index) => (
                  <li key={index} className="text-gray-700">{warning}</li>
                ))}
              </ul>
            </section>
          )}

          {drug.mechanismOfAction && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mechanism of Action</h3>
              <p className="text-gray-700">{drug.mechanismOfAction}</p>
            </section>
          )}

          {drug.dosage && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dosage</h3>
              <p className="text-gray-700">{drug.dosage}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}