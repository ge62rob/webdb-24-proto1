import React from 'react';
import { FileText, ListChecks, AlertOctagon, Activity, Scale } from 'lucide-react';
import { Drug } from '../types';

interface PrescriptionInfoProps {
  drug: Drug | null;
}

export function PrescriptionInfo({ drug }: PrescriptionInfoProps) {
  if (!drug) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 h-full">
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>Select a medication to view prescription information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full overflow-auto">
      <div className="prose max-w-none">
        <div className="flex items-center space-x-2 mb-6">
          <FileText className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900 m-0">HIGHLIGHTS OF PRESCRIBING INFORMATION</h2>
        </div>

        <div className="space-y-6">
          <section>
            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4">
              <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-2">
                <ListChecks className="h-5 w-5 mr-2 text-indigo-600" />
                INDICATIONS AND USAGE
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {drug.indications?.map((indication, index) => (
                  <li key={index} className="text-gray-700">{indication}</li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-2">
                <AlertOctagon className="h-5 w-5 mr-2 text-red-600" />
                WARNINGS AND PRECAUTIONS
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {drug.warnings?.map((warning, index) => (
                  <li key={index} className="text-red-700">{warning}</li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-2">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                MECHANISM OF ACTION
              </h3>
              <p className="text-gray-700">{drug.mechanismOfAction}</p>
            </div>
          </section>

          <section>
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-2">
                <Scale className="h-5 w-5 mr-2 text-green-600" />
                DOSAGE AND ADMINISTRATION
              </h3>
              <p className="text-gray-700">{drug.dosage}</p>
            </div>
          </section>

          {drug.contraindications && (
            <section className="bg-orange-50 border-l-4 border-orange-500 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">CONTRAINDICATIONS</h3>
              <ul className="list-disc list-inside space-y-1">
                {drug.contraindications.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}