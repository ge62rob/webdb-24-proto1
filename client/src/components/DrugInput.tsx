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

  // 每次搜索词变化时重置 highlightedIndex
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  // 搜索函数：执行搜索并清空输入和建议
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

  // 当输入变化时，调用后端获取建议列表
  const handleInputChange = async (value: string) => {
    setSearchTerm(value);
    setError(null);
    if (!value) {
      setSuggestions([]);
      return;
    }
    try {
      const matches = await autoCompleteDrugs(value.toLowerCase());
      // 根据匹配位置排序（匹配位置越靠前越靠前）
      const sorted = matches.sort((a, b) =>
        a.toLowerCase().indexOf(value.toLowerCase()) - b.toLowerCase().indexOf(value.toLowerCase())
      );
      setSuggestions(sorted);
    } catch (err) {
      console.error('Autocomplete error:', err);
      setSuggestions([]);
    }
  };

  // 处理键盘事件：回车、上下箭头
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      // 如果下拉列表不为空，则移动高亮项
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
      // 如果有高亮项，则选中高亮项进行搜索，否则按输入搜索
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

  // 点击下拉建议时的处理：填充输入并搜索
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
