import { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';

const ScoreSearchWidget = () => {
    const { viewPrivateScore, isReady } = useWeb3();
    const [searchAddress, setSearchAddress] = useState('');
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchAddress) return;
        
        setLoading(true);
        setError('');
        setScore(null);
        
        try {
            const revealedScore = await viewPrivateScore(searchAddress);
            setScore({
                address: searchAddress,
                value: Number(revealedScore)
            });
        } catch (err) {
            console.error('Failed to view score:', err);
            setError(err.message || 'Failed to view score. Ensure you have sufficient credits (0.01 ETH).');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4">Search Trust Score</h2>
            <p className="text-gray-400 text-sm mb-4">
                Pay <span className="text-cyan-400 font-bold">0.01 ETH</span> in credits to view any user's score.
            </p>
            
            <form onSubmit={handleSearch} className="space-y-4">
                <input
                    type="text"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="Enter wallet address (0x...)"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm font-mono outline-none focus:ring-1 focus:ring-blue-500"
                />
                
                <button
                    type="submit"
                    disabled={!isReady || loading || !searchAddress}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                        isReady && !loading && searchAddress
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90"
                            : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                >
                    {loading ? "Searching..." : "🔍 Search & Pay"}
                </button>
            </form>

            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs">
                    {error}
                </div>
            )}

            {score && (
                <div className="mt-6 p-4 bg-gray-950 border border-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 mb-2">Address</div>
                    <div className="text-xs font-mono text-gray-300 mb-4 break-all">{score.address}</div>
                    
                    <div className="text-xs text-gray-500 mb-2">Trust Score</div>
                    <div className={`text-4xl font-bold ${
                        score.value >= 800 ? "text-green-500" : 
                        score.value >= 400 ? "text-yellow-500" : 
                        "text-red-500"
                    }`}>
                        {score.value}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">out of 1000</div>
                </div>
            )}
        </div>
    );
};

export default ScoreSearchWidget;
