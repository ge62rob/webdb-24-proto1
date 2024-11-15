import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Drug } from '../types';
import { searchDrugs } from '../services/drugService';

interface DrugInputProps {
  onAddDrug: (drug: Drug) => void;
}

export function DrugInput({ onAddDrug }: DrugInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (searchTerm.trim().length === 0) {
      setError('Please enter a drug name.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchDrugs(searchTerm.trim());
      if (results.length > 0) {
        onAddDrug(results[0]);
        setSearchTerm('');
      } else {
        setError('No results found.');
      }
    } catch (err) {
      setError('Failed to fetch drug data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter a medication name..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          aria-label="Search medications"
        />
        <button
          onClick={handleSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 rounded-lg"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="mt-2 text-red-600">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
