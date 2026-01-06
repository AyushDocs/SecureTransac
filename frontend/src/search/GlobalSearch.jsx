import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Google-style global search component
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
        <h1 className="text-4xl font-bold text-foreground mb-2">Address Lookup</h1>
        <p className="text-muted-foreground">Search any wallet address to view trust score and transaction history</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground"
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
            className="w-full h-14 pl-14 pr-4 bg-card border border-border rounded-xl text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Searches</h3>
        <div className="space-y-2">
          {recentSearches.map((address, index) => (
            <button
              key={index}
              onClick={() => handleRecentClick(address)}
              className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-lg text-left hover:bg-accent transition-colors"
            >
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-mono text-foreground truncate">{address}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GlobalSearch;
