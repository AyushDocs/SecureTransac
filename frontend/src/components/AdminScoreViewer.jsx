import axios from 'axios';
import { useState } from 'react';

const AdminScoreViewer = () => {
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
            // Admin uses backend API which calls getScore (free for admin)
            const response = await axios.get(`http://localhost:5000/api/admin/score/${searchAddress}`);
            setScore({
                address: searchAddress,
                value: response.data.score
            });
        } catch (err) {
            console.error('Failed to fetch score:', err);
            setError(err.response?.data?.error || 'Failed to fetch score');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-2">Admin Score Viewer</h2>
            <p className="text-gray-400 text-sm mb-4">
                View any user's score <span className="text-green-500 font-bold">FREE</span> (Admin Privilege)
            </p>
            
            <form onSubmit={handleSearch} className="space-y-4">
                <input
                    type="text"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="Enter wallet address (0x...)"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm font-mono outline-none focus:ring-1 focus:ring-green-500"
                />
                
                <button
                    type="submit"
                    disabled={loading || !searchAddress}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                        !loading && searchAddress
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90"
                            : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                >
                    {loading ? "Fetching..." : "🔍 View Score (Free)"}
                </button>
            </form>

            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs">
                    {error}
                </div>
            )}

            {score && (
                <div className="mt-6 p-4 bg-gray-950 border border-green-500/20 rounded-lg">
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
                    
                    <div className="mt-4 p-2 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-500">
                        ✓ Viewed using Admin privileges (no cost)
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminScoreViewer;
