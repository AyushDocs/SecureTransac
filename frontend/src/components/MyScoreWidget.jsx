import { useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';

const MyScoreWidget = ({ userAddress }) => {
    const { viewPrivateScore, isReady } = useWeb3();
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUnlock = async () => {
        if (!userAddress) return;
        
        setLoading(true);
        setError('');
        
        try {
            const revealedScore = await viewPrivateScore(userAddress);
            setScore(Number(revealedScore));
        } catch (err) {
            console.error('Failed to unlock score:', err);
            setError(err.message || 'Failed to unlock score. Ensure you have sufficient credits.');
        } finally {
            setLoading(false);
        }
    };

    if (score !== null) {
        const normalizedScore = score / 100; // Convert 0-100 to 0-1
        const riskColor = normalizedScore >= 0.8 ? "text-green-500" : normalizedScore >= 0.4 ? "text-yellow-500" : "text-red-500";
        
        return (
            <>
                <div className={`text-5xl font-mono font-bold ${riskColor} mb-2`}>
                    {Number(score).toFixed(2)}
                </div>
                <p className="text-gray-400 text-sm">Base score: 0 - 100</p>
                <p className="text-xs text-gray-500 mt-4 italic">
                    Score unlocked. Refresh to lock again.
                </p>
            </>
        );
    }

    return (
        <div className="text-center py-8">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔒</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">
                Your Trust Score is private. Pay <span className="text-cyan-400 font-bold">0.01 AV</span> in credits to unlock.
            </p>
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs">
                    {error}
                </div>
            )}
            <button
                onClick={handleUnlock}
                disabled={!isReady || loading}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                    isReady && !loading
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
            >
                {loading ? "Unlocking..." : "🔓 Unlock My Score"}
            </button>
            <p className="text-xs text-gray-600 mt-4">
                Like CIBIL, your score is confidential until revealed.
            </p>
        </div>
    );
};

export default MyScoreWidget;
