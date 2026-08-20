import { useState } from "react";
import { useNavigate } from "react-router-dom";

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [recentSearches] = useState([
    "0x742d35Cc6634C0532925a3b844Bc9e7595f2e322",
    "0x8Ba1f109551bD432803012645Ac136ddd64DBA72",
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  ]);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/address/${query.trim()}`);
    }
  };

  const handleRecentClick = (address) => {
    navigate(`/address/${address}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Address Lookup</h1>
        <p className="text-gray-400">Search any wallet address to view trust score and transaction history</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter wallet address (0x...)"
            className="w-full h-14 pl-14 pr-4 bg-gray-800 border border-gray-700 rounded-xl text-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Searches</h3>
        <div className="space-y-2">
          {recentSearches.map((address, index) => (
            <button
              key={index}
              onClick={() => handleRecentClick(address)}
              className="w-full flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg text-left hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-mono text-white truncate">{address}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GlobalSearch;
