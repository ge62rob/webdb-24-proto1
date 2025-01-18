import React, { useState } from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Drug } from '../types';
import { getDrugInteractionAnalysis } from '../services/drugService';

interface InteractionPanelProps {
  drugs: Drug[];
}

export function InteractionPanel({ drugs }: InteractionPanelProps) {
  interface AnalysisResult {
    summary: string;
    details: string;
    rating: string;
  }

  const [analysis, setAnalysis] = useState<Record<string, AnalysisResult> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [hideSafe, setHideSafe] = useState(false);

  const handleAnalyzeInteractions = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setExpandedSections({});
    setHideSafe(false);

    try {
      const drugIds = drugs.map((d) => d.id);
      // 获取分析结果
      const results = await getDrugInteractionAnalysis(drugIds);
      console.log('Raw analysis result:', results);
      
      // 将结果转换为 { 'A-B': '...', 'A-C': '...', 'B-C': '...' } 格式
      const analysisMap: Record<string, AnalysisResult> = {};
      // 按空行分割结果
      for (let i = 0; i < drugs.length; i++) {
        for (let j = i + 1; j < drugs.length; j++) {
          const drug1 = drugs[i].name;
          const drug2 = drugs[j].name;
          const displayKey = `${drug1}-${drug2}`;
          
          // 查找对应的分析结果
          const result = results.find(r =>
            (r.drug1_name === drug1 && r.drug2_name === drug2) ||
            (r.drug1_name === drug2 && r.drug2_name === drug1)
          );
          
          analysisMap[displayKey] = {
            summary: result?.summary || `No summary available for ${drug1} and ${drug2}`,
            details: result?.details || `No details available for ${drug1} and ${drug2}`,
            rating: result?.risk_rating || 'Unknown'
          };
        }
      }
      
      setAnalysis(analysisMap as Record<string, AnalysisResult>);
      // 默认全部折叠
      setExpandedSections({});
    } catch (err) {
      console.error(err);
      setError('Failed to analyze drug interactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900">Drug Interactions</h2>
        </div>
        <button
          onClick={() => setHideSafe(prev => !prev)}
          className="bg-gray-300 text-black px-3 py-1 rounded-md"
        >
          {hideSafe ? 'Show Safe' : 'Hide Safe'}
        </button>
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
        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <h3 className="text-xl font-bold text-gray-900">Interaction Analysis</h3>
          </div>

          <div className="space-y-2">
            {Object.entries(analysis)
              .filter(([, { rating }]) => !(hideSafe && rating === 'Safe'))
              .sort(([, a], [, b]) => {
                const ratingOrder: Record<string, number> = { Prohibited: 0, Warning: 1, Safe: 2 };
                return ratingOrder[a.rating] - ratingOrder[b.rating];
              })
              .map(([key, { summary, details, rating }]) => {
              const ratingColorMap: Record<string, string> = {
                Safe: 'bg-green-100',
                Warning: 'bg-yellow-100',
                Prohibited: 'bg-red-100',
                Unknown: 'bg-gray-100'
              };

              return (
                <div
                  key={key}
                  className={`rounded-lg shadow-sm border border-gray-100 ${ratingColorMap[rating]}`}
                >
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full p-4 flex items-center justify-between hover:bg-opacity-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <ChevronRight
                        className={`h-5 w-5 text-gray-500 transition-transform ${
                          expandedSections[key] ? 'rotate-90' : ''
                        }`}
                      />
                      <span className="font-medium text-gray-900">{key} Interaction</span>
                    </div>
                  </button>

                  {!expandedSections[key] && (
                    <div className="p-4 pt-2">
                      <p className="text-gray-700">{summary}</p>
                    </div>
                  )}
                  {expandedSections[key] && (
                    <div className="p-4 pt-2 border-t border-gray-100">
                      <div className="prose max-w-none">
                        <p className="text-gray-700">{details}</p>
                      </div>
                    </div>
                  )}
                  <div className="p-4 pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Risk Rating: {rating}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
