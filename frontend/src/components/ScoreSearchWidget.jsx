import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/config';
import { useWeb3 } from '../hooks/useWeb3';

const ScoreSearchWidget = () => {
    const { viewPrivateScore, isReady, getCredits, depositCredits, getEthBalance, account, connectWallet, submitRangeProof, contract, chainId } = useWeb3();
    const { token } = useAuth();
    const [searchAddress, setSearchAddress] = useState('');
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [zkLoading, setZkLoading] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState('');
    const [error, setError] = useState('');
    const [userCredits, setUserCredits] = useState(0);
    const [ethBalance, setEthBalance] = useState("0");

    const handleZKVerify = async () => {
        if (!account || !token) return;
        if (!searchAddress) {
            setError("Please enter an address to verify.");
            return;
        }

        setZkLoading(true);
        setError('');
        setVerificationSuccess('');
        try {
            // 1. Request Proof from Backend (Delegated)
            // Backend re-encrypts with known 'r' and returns proof
            const res = await fetch(`${API_BASE_URL}/admin/proof`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    address: searchAddress, 
                    threshold: 80, // Default whitelist requirement
                    secret: "delegated" // Backend handles retrieval 
                })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            
            // 2. Submit Proof to Contract
            await submitRangeProof(data.pi_a, data.pi_b, data.pi_c, 80);
            // alert("ZK Proof Submitted & Verified on-chain!"); // Removed for better UI
            setVerificationSuccess("ZK Proof Verified! User is whitelisted (Score >= 80).");
        } catch (err) {
            console.error("ZK Failure:", err);
            setError("ZK Verification Failed: " + err.message);
        } finally {
            setZkLoading(false);
        }
    };

    // Fetch credits and ETH balance on load
    useEffect(() => {
        console.log(`[ScoreWidget] Effect triggered. Ready: ${isReady}, Account: ${account}`);
        if (isReady && account) {
            getCredits().then(c => {
                 console.log(`[ScoreWidget] Credits fetched: ${c}`);
                 setUserCredits(Number(c));
            });
            if (getEthBalance) {
               getEthBalance().then(b => {
                   console.log(`[ScoreWidget] ETH Balance fetched: ${b}`);
                   setEthBalance(b);
               });
            }
        }
    }, [isReady, account]);

    const handleDeposit = async () => {
        setLoading(true);
        try {
            await depositCredits("0.1"); // Deposit 0.1 AV
            const newCredits = await getCredits();
            setUserCredits(Number(newCredits));
            // Refresh ETH balance
            if (getEthBalance) getEthBalance().then(b => setEthBalance(b));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchAddress) return;
        
        // Check local credit cache first
        if (userCredits < 0.01) {
            setError("Insufficient Balance. Please swap ETH for AV to view scores.");
            return;
        }

        setLoading(true);
        setError('');
        setScore(null);
        
        try {
            // 1. Pay for access on-chain (Keep this to ensure usage of credits)
            await viewPrivateScore(searchAddress);
            
            // 2. Fetch decrypted score from Backend (Since contract returns encrypted bytes)
            const res = await fetch(`${API_BASE_URL}/admin/score/${searchAddress}`);
            if (!res.ok) throw new Error("Failed to fetch decrypted score from backend");
            
            const data = await res.json();
            
            setScore({
                address: searchAddress,
                value: data.score // Backend returns 0-1000 scale
            });

            // Update credits after spend
            getCredits().then(c => setUserCredits(Number(c)));
        } catch (err) {
            console.error('Failed to view score:', err);
            // Detect revert
            if (err.message && err.message.includes("revert")) {
                 setError("Transaction reverted. Likely insufficient credits or unauthorized.");
            } else {
                 setError(err.message || 'Failed to view score.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4">Search Trust Score</h2>
            <div className="flex justify-between items-center mb-4">
                <p className="text-gray-400 text-sm">
                    Cost: <span className="text-cyan-400 font-bold">0.01 AV</span>
                </p>
                <div className="text-xs">
                    <span className="text-gray-500">Balance: </span>
                    <span className={`font-mono font-bold ${userCredits < 0.01 ? 'text-red-500' : 'text-green-500'}`}>
                        {userCredits ? userCredits.toFixed(3) : '0.000'} AV
                    </span>
                </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
                Pay <span className="text-cyan-400 font-bold">0.01 AV</span> to view any user's score.
            </p>
            
            {!account ? (
                 <div className="flex flex-col items-center justify-center py-6 space-y-4">
                     <p className="text-gray-400 text-sm text-center">Connect your wallet to check trust scores.</p>
                     <button
                        onClick={connectWallet}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-all"
                     >
                        🔌 Connect Wallet
                     </button>
                 </div>
            ) : (
                <>
                <form onSubmit={handleSearch} className="space-y-4">
                <input
                    type="text"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="Enter wallet address (0x...)"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm font-mono outline-none focus:ring-1 focus:ring-blue-500"
                />
                
                {userCredits < 0.01 ? (
                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2 text-xs">
                             <span className="text-gray-300">You have: <span className="text-white font-mono">{Number(ethBalance).toFixed(4)}</span> ETH</span>
                        </div>
                        {!isReady && (
                            <div className="text-red-400 text-xs mb-2 text-center">
                                ⚠️ Contract not detected. Wrong network?
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleDeposit}
                            disabled={!isReady || loading}
                            className={`w-full py-3 rounded-lg font-bold transition-all flex justify-center items-center gap-2 ${
                                !isReady || loading 
                                ? "bg-yellow-800 text-gray-400 cursor-not-allowed opacity-50" 
                                : "bg-yellow-600 hover:bg-yellow-500 text-white"
                            }`}
                        >
                            {loading ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <span>💳</span>
                                    <span>Swap 0.1 ETH for 0.1 AV</span>
                                </>
                            )}
                        </button>
                    </div>
                ) : (
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
                )}
                </form>
                
                </>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs">
                    {error}
                </div>
            )}

            {verificationSuccess && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs flex items-center gap-2">
                    <span>✅</span> {verificationSuccess}
                </div>
            )}

            {score && (
                <div className="mt-6 p-4 bg-gray-950 border border-gray-800 rounded-lg">
                    
                    <div className="text-xs text-gray-500 mb-2">Trust Score</div>
                    <div className={`text-4xl font-bold ${
                        score.value >= 800 ? "text-green-500" : 
                        score.value >= 400 ? "text-yellow-500" : 
                        "text-red-500"
                    }`}>
                        {score.value/1000}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScoreSearchWidget;
