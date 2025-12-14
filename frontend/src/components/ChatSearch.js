import React, { useState } from 'react';
import { itemsAPI } from '../services/api';
import ItemCard from './ItemCard';
import '../styles/ChatSearch.css';

function ChatSearch() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    setSearching(true);

    try {
      const result = await itemsAPI.search(query);

      setResults(result);
      setHistory([
        ...history,
        {
          query,
          count: result.count,
          timestamp: new Date(),
        }
      ]);

    } catch (err) {
      console.error('Search error:', err);
      setResults({
        error: err.response?.data?.error || 'Search failed. Please try again.',
        items: [],
        count: 0,
      });
    } finally {
      setSearching(false);
    }
  };

  const handleQuickSearch = (quickQuery) => {
    setQuery(quickQuery);
    // Trigger search
    setTimeout(() => {
      document.getElementById('search-form').requestSubmit();
    }, 100);
  };

  const quickSearches = [
    "What can we gift a 6-year-old?",
    "Show me toys for kids",
    "Gifts for grandmother",
    "Educational items for teens",
    "Kitchen items",
    "What books do we have?",
  ];

  return (
    <div className="chat-search">
      <div className="chat-header">
        <h2>🎁 Find the Perfect Gift</h2>
        <p>Ask me anything about your gifting registry!</p>
      </div>

      <form id="search-form" onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., 'What can we gift a 6-year-old?' or 'Show me educational toys'"
            disabled={searching}
            className="search-input"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="search-btn"
          >
            {searching ? '🔍 Searching...' : '🔍 Search'}
          </button>
        </div>
      </form>

      <div className="quick-searches">
        <p className="quick-searches-label">Try asking:</p>
        <div className="quick-search-buttons">
          {quickSearches.map((qs, index) => (
            <button
              key={index}
              onClick={() => handleQuickSearch(qs)}
              className="quick-search-btn"
              disabled={searching}
            >
              {qs}
            </button>
          ))}
        </div>
      </div>

      {results && (
        <div className="search-results">
          {results.error ? (
            <div className="error-message">
              ❌ {results.error}
            </div>
          ) : (
            <>
              <div className="results-header">
                <h3>
                  Found {results.count} item{results.count !== 1 ? 's' : ''}
                </h3>
                {results.parsedFilters && Object.keys(results.parsedFilters).length > 0 && (
                  <div className="parsed-filters">
                    <p><strong>Understood filters:</strong></p>
                    <ul>
                      {results.parsedFilters.ageRange && (
                        <li>Age: {results.parsedFilters.ageRange}</li>
                      )}
                      {results.parsedFilters.category && (
                        <li>Category: {results.parsedFilters.category}</li>
                      )}
                      {results.parsedFilters.theme && (
                        <li>Theme: {results.parsedFilters.theme}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {results.items.length === 0 ? (
                <div className="no-results">
                  <p>No items found matching your query.</p>
                  <p>Try different keywords or browse all items.</p>
                </div>
              ) : (
                <div className="results-grid">
                  {results.items.map((item) => (
                    <ItemCard key={item.item_id} item={item} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="search-history">
          <h4>Recent Searches</h4>
          <ul>
            {history.slice(-5).reverse().map((h, index) => (
              <li key={index} onClick={() => setQuery(h.query)}>
                "{h.query}" - {h.count} result{h.count !== 1 ? 's' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ChatSearch;
