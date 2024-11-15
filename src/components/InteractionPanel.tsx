import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Drug } from '../types';
import { getDrugInteractionAnalysis } from '../services/drugService';

interface InteractionPanelProps {
  drugs: Drug[];
}

export function InteractionPanel({ drugs }: InteractionPanelProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeInteractions = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await getDrugInteractionAnalysis(drugs);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze drug interactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <AlertTriangle className="h-6 w-6 text-yellow-500" />
        <h2 className="text-xl font-bold text-gray-900">Drug Interactions</h2>
      </div>

      <button
        onClick={handleAnalyzeInteractions}
        className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600"
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Interactions'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {analysis && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Interaction Analysis</h3>
          <p className="whitespace-pre-wrap">{analysis}</p>
        </div>
      )}
    </div>
  );
}
