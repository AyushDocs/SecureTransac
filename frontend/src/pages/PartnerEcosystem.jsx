import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../layout/PageWrapper';

const PartnerEcosystem = () => {
    const { user } = useAuth();
    const [score, setScore] = useState(500);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.address) {
            fetchScore();
        }
    }, [user?.address]);

    const fetchScore = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/admin/score/${user.address}`);
            setScore(res.data.score || 500);
        } catch (err) {
            console.error("Failed to fetch score for ecosystem demo", err);
        } finally {
            setLoading(false);
        }
    };

    // DeFi Logic Simulation
    const calculateLendingRate = () => {
        if (score > 800) return "1.5%"; // Prime
        if (score > 600) return "4.2%"; // Standard
        if (score > 400) return "8.5%"; // Risk
        return "15.0% + High Collateral"; // Subprime
    };

    const calculateMaxLoan = () => {
        if (score > 900) return "100 ETH (Uncollateralized)";
        if (score > 750) return "50 ETH (Reputation Backed)";
        if (score > 600) return "25 ETH (30% Collateral)";
        return "5 ETH (150% Collateral)";
    };

    return (
        <PageWrapper title="Partner Ecosystem Integration">
            <div className="space-y-8">
                {/* Intro Header */}
                <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30 p-8 rounded-2xl">
                    <h2 className="text-2xl font-black text-white mb-2">Build on Trust</h2>
                    <p className="text-gray-300 max-w-2xl">
                        SecureTransac provides a developer-friendly Security Oracle. Any protocol can consume trust scores 
                        directly from our smart contracts to enable gated features, reduced fees, or improved DeFi parameters.
                    </p>
                    <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                        <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/10 shrink-0">
                            <div className="text-[10px] text-gray-500 font-bold uppercase">My Verified Score</div>
                            <div className="text-xl font-mono font-bold text-cyan-400">{score}</div>
                        </div>
                        <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/10 shrink-0">
                            <div className="text-[10px] text-gray-500 font-bold uppercase">Virtual Collateral</div>
                            <div className="text-xl font-mono font-bold text-green-400">${(score * 12).toLocaleString()}</div>
                        </div>
                        <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/10 shrink-0">
                            <div className="text-[10px] text-gray-500 font-bold uppercase">Status</div>
                            <div className={`text-xl font-bold ${score > 700 ? 'text-green-500' : 'text-yellow-500'}`}>
                                {score > 700 ? 'ECOSYSTEM PRIME' : 'STANDARD TIER'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* DeFi Case Study */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-800 bg-gray-800/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-xl">🏦</div>
                                <div>
                                    <h3 className="text-white font-bold">SecureLend (DeFi Utility)</h3>
                                    <p className="text-xs text-gray-500">Under-collateralized lending based on trust history.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6 flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl">
                                    <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase">APR (Interest Rate)</div>
                                    <div className="text-2xl font-black text-white">{calculateLendingRate()}</div>
                                    <div className="text-[10px] text-blue-500 mt-2">Verified by SecureTransac</div>
                                </div>
                                <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl">
                                    <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase">Max Borrow Limit</div>
                                    <div className="text-sm font-bold text-white leading-tight">{calculateMaxLoan()}</div>
                                    <div className="text-[10px] text-cyan-500 mt-2">Dynamic risk adjustment</div>
                                </div>
                            </div>
                            
                            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-lg">
                                <p className="text-xs text-gray-400 italic leading-relaxed">
                                    "By integrating SecureTransac scores, SecureLend has reduced liquidation volatility by 40% 
                                    while offering prime rates to 15,000+ trusted Ethereum users."
                                </p>
                            </div>

                            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20">
                                Apply for Partner Loan
                            </button>
                        </div>
                    </div>

                    {/* NFT Marketplace Case Study */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-800 bg-gray-800/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-xl">🎨</div>
                                <div>
                                    <h3 className="text-white font-bold">SecureMarket (NFT Portal)</h3>
                                    <p className="text-xs text-gray-500">Preventing counterparty risk in OTC trades.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6 flex-1 text-center">
                            <p className="text-sm text-gray-400">Your profile preview on SecureMarket:</p>
                            
                            <div className="max-w-xs mx-auto bg-gray-950 border border-gray-800 p-6 rounded-2xl shadow-2xl relative">
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 border-4 border-gray-900 shadow-xl overflow-hidden">
                                     <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white">
                                        {user?.name?.charAt(0) || 'U'}
                                     </div>
                                </div>
                                <h4 className="text-white font-bold">{user?.name || 'Anonymous User'}</h4>
                                <div className="text-[10px] font-mono text-gray-500 mb-4">{user?.address?.slice(0, 14)}...</div>
                                
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-center gap-2 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg border border-green-500/20">
                                        <span className="text-sm">🛡️</span>
                                        <span className="text-[11px] font-black uppercase tracking-widest">Trusted Seller</span>
                                    </div>
                                    <div className="text-[9px] text-gray-600 font-bold uppercase tracking-tight">Verified by SecureTransac Oracle</div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500">
                                Users with scores &gt; 700 automatically receive the <b>Trusted Seller</b> badge, 
                                resulting in 3x faster trade completion times.
                            </p>

                            <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20 mt-auto">
                                Sync with SecureMarket
                            </button>
                        </div>
                    </div>
                </div>

                {/* Developer Documentation Preview */}
                <div className="bg-gray-950 border border-gray-800 p-8 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="text-cyan-400">⚡</span> Developer Integration Guide
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-sm text-gray-400 mb-4">
                                Integration is as simple as calling <code>getScore(address)</code> on our registry contract. 
                                We support Gasless Permis via EIP-2612 for credits management.
                            </p>
                            <pre className="bg-black/60 p-4 rounded-xl text-xs font-mono text-cyan-300 border border-white/5 overflow-x-auto">
{`// Example Solidity Integration
interface ITrustRegistry {
    function getScore(address user) external view returns (uint256);
}

contract MyPartnerContract {
    ITrustRegistry public registry;
    
    function buyItem() external {
        uint256 score = registry.getScore(msg.sender);
        require(score >= 600, "Trust score too low");
        // ... proceed with logic
    }
}`}
                            </pre>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                                <div className="font-bold text-white text-sm mb-1 uppercase tracking-tight">Standard API (REST)</div>
                                <p className="text-xs text-gray-500 leading-normal">
                                    Use our high-performance caching layer for off-chain applications.
                                    <code>GET /api/admin/score/:address</code>
                                </p>
                            </div>
                            <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                                <div className="font-bold text-white text-sm mb-1 uppercase tracking-tight">On-Chain Oracle</div>
                                <p className="text-xs text-gray-500 leading-normal">
                                    Direct access to the decentralized registry for pure web3 dApps.
                                </p>
                            </div>
                            <a 
                                href="http://localhost:5000/api-docs" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-cyan-400 text-sm font-bold flex items-center gap-2 hover:underline"
                            >
                                View Full API Spec (Swagger) <span className="text-lg">→</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default PartnerEcosystem;
