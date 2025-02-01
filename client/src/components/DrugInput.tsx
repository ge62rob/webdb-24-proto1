import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Drug } from '../types';
import { searchDrugs} from '../services/drugService';
import { autoCompleteDrugs } from '../services/api';

interface DrugInputProps {
  onAddDrug: (drug: Drug) => void;
}

export function DrugInput({ onAddDrug }: DrugInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset highlightedIndex every time the search term changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  // Search function: Perform search and clear input and suggestions
  const handleSearch = async (term?: string) => {
    const query = term !== undefined ? term : searchTerm;
    if (query.trim().length === 0) {
      setError('Please enter a drug name.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const results = await searchDrugs(query.trim());
      if (results.length > 0) {
        onAddDrug(results[0]);
        setSearchTerm('');
        setSuggestions([]);
      } else {
        setError('No results found.');
      }
    } catch (err) {
      setError('Failed to fetch drug data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // When input changes, call backend to get suggestion list
  const handleInputChange = async (value: string) => {
    setSearchTerm(value);
    setError(null);
    if (!value) {
      setSuggestions([]);
      return;
    }
    try {
      const matches = await autoCompleteDrugs(value.toLowerCase());
      console.log("matches from API:", matches);  // Debug output, confirm data type
      if (!Array.isArray(matches)) {
        console.error("Expected array for matches, got:", matches);
        setSuggestions([]);
        return;
      }
      // Sort based on match position (earlier matches come first)
      const sorted = matches.sort((a, b) =>
        a.toLowerCase().indexOf(value.toLowerCase()) - b.toLowerCase().indexOf(value.toLowerCase())
      );
      setSuggestions(sorted);
    } catch (err) {
      console.error('Autocomplete error:', err);
      setSuggestions([]);
    }
  };

  // Handle keyboard events: Enter, Arrow Up/Down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      // If dropdown list is not empty, move highlighted item
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // If there is a highlighted item, select it for search, otherwise search by input
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        const selected = suggestions[highlightedIndex];
        setSearchTerm(selected);
        setSuggestions([]);
        handleSearch(selected);
      } else {
        handleSearch();
      }
    }
  };

  // Handle click on dropdown suggestions: Fill input and search
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setSuggestions([]);
    handleSearch(suggestion);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a medication name..."
          className="w-full pl-10 pr-24 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          aria-label="Search medications"
        />
        <button
          onClick={() => handleSearch()}
          disabled={isLoading}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 rounded-lg disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* 下拉列表展示建议 */}
      {suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          {suggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(item)}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                index === highlightedIndex ? 'bg-gray-200' : ''
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="mt-2 text-red-600">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
