import React, { useState } from 'react';
import { ChevronRight, AlertCircle, Pill, Trash2, MessageCircle } from 'lucide-react';
import { Drug } from '../types';
import { chatWithProspectus } from '../services/api';

interface DrugCardProps {
  drug: Drug;
  onSelect: (drug: Drug) => void;
  onRemove: (id: string) => void;
}

export function DrugCard({ drug, onSelect, onRemove }: DrugCardProps) {
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatting, setChatting] = useState<boolean>(false);
  const [question, setQuestion] = useState<string>('');

  const handleChat = async () => {
    setChatting(true);
    setChatResponse(null);

    try {
      const prospectus = `
        Indications: ${drug.indications.join(', ')}
        Warnings: ${drug.warnings.join(', ')}
        Mechanism of Action: ${drug.mechanismOfAction}
        Dosage: ${drug.dosage}
        Contraindications: ${drug.contraindications.join(', ')}
      `;

      if (question.trim()) {
        const response = await chatWithProspectus(prospectus, question);
        setChatResponse(response);
      } else {
        setChatResponse('Please enter a valid question.');
      }
    } catch (error) {
      setChatResponse('Failed to retrieve information. Please try again.');
    } finally {
      setChatting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Pill className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{drug.name}</h3>
              <p className="text-sm text-gray-500">{drug.category || 'Uncategorized'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSelect(drug)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
            <button
              onClick={handleChat}
              className="p-2 hover:bg-blue-100 rounded-full transition-colors"
              disabled={chatting}
            >
              <MessageCircle className="h-5 w-5 text-blue-500" />
            </button>
            <button
              onClick={() => onRemove(drug.id)}
              className="p-2 hover:bg-red-100 rounded-full transition-colors"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="question" className="block text-sm font-medium text-gray-700">
            Ask a question about this drug:
          </label>
          <input
            type="text"
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
            placeholder="Enter your question here..."
          />
          <button
            onClick={handleChat}
            className="mt-2 w-full bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600"
            disabled={chatting}
          >
            {chatting ? 'Fetching Answer...' : 'Ask Question'}
          </button>
        </div>

        {chatResponse && (
          <div className="mt-3 text-sm text-gray-700 bg-gray-100 p-2 rounded-lg">
            {chatResponse}
          </div>
        )}

        {drug.warnings && drug.warnings.length > 0 && (
          <div className="mt-3 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{drug.warnings[0]}</p>
          </div>
        )}
      </div>
    </div>
  );
}
