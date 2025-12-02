import { useState, useEffect } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  showResultCount?: boolean;
  resultCount?: number;
}

function SearchBar({ 
  onSearch, 
  placeholder = 'Search...', 
  debounceMs = 400,
  showResultCount = false,
  resultCount = 0
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Only search on submit or clear
  // Removed debounced useEffect

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  return (
    <div className="search-bar-container">
      <form className="search-bar" onSubmit={handleSubmit}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-input"
        />
        {isSearching && <span className="search-loading">⏳</span>}
        {query && !isSearching && (
          <button
            type="button"
            onClick={handleClear}
            className="search-clear"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </form>
      {showResultCount && query && (
        <div className="search-result-count">
          Found {resultCount} result{resultCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
