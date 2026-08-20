import axios from 'axios';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../layout/PageWrapper';
import { API_BASE_URL, CONTRACT_ADDRESSES } from '../api/config';

const BridgePortal = () => {
    const { user } = useAuth();
    const [targetAddr, setTargetAddr] = useState('');
    const [sourceChain, setSourceChain] = useState('1337');
    const [targetChain, setTargetChain] = useState('80002');
    const [status, setStatus] = useState('idle');
    const [txHash, setTxHash] = useState('');
    const [syncedScore, setSyncedScore] = useState(null);

    const handleBridge = async (e) => {
        e.preventDefault();
        setStatus('syncing');
        setTxHash('');
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/admin/bridge/sync`, {
                userAddress: targetAddr,
                sourceChainId: sourceChain,
                sourceContract: CONTRACT_ADDRESSES.TrustRegistry, // Default local for demo
                targetChainId: targetChain,
                targetContract: CONTRACT_ADDRESSES.TrustRegistry // Relayer pushes to target
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSyncedScore(res.data.score);
            setTxHash(res.data.txHash);
            setStatus('success');
        } catch (err) {
            console.error("Bridge Sync Error:", err);
            setStatus('error');
        }
    };

    return (
        <PageWrapper title="Cross-Chain Trust Bridge">
            <div className="max-w-4xl mx-auto">
                <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-gray-800 bg-gradient-to-br from-blue-600/10 to-purple-600/10">
                        <h2 className="text-2xl font-black text-white mb-2">Sync Global Reputation</h2>
                        <p className="text-gray-400 text-sm">
                            Reputation should not be siloed. Our bridge relayer allows you to prove your trust score on one chain 
                            and migrate it to another without losing your history.
                        </p>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleBridge} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Source Network</label>
                                    <select 
                                        value={sourceChain} 
                                        onChange={e => setSourceChain(e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="1337">Localhost (Dev)</option>
                                        <option value="11155111">Ethereum Sepolia</option>
                                        <option value="80002">Polygon Amoy</option>
                                    </select>
                                </div>

                                <div className="flex justify-center md:pt-6">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-4 md:col-start-1 md:mt-0">
                                     {/* This layout is a bit weird, let's fix grid */}
                                </div>
                                
                                <div className="space-y-4 md:col-start-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Target Network</label>
                                    <select 
                                        value={targetChain} 
                                        onChange={e => setTargetChain(e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-purple-500"
                                    >
                                        <option value="80002">Polygon Amoy</option>
                                        <option value="11155111">Ethereum Sepolia</option>
                                        <option value="421614">Arbitrum Sepolia</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Address to Sync</label>
                                <input 
                                    type="text" 
                                    placeholder="0x..." 
                                    value={targetAddr}
                                    onChange={e => setTargetAddr(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white font-mono text-sm focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={status === 'syncing'}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                            >
                                {status === 'syncing' ? 'PROVING ON-CHAIN...' : 'INITIATE CROSS-CHAIN SYNC'}
                            </button>
                        </form>

                        {status === 'success' && (
                            <div className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl animate-in slide-in-from-top-4">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xl shadow-lg shadow-green-500/30">
                                        ✓
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold mb-1 tracking-tight">Proof Relayed Successfully</h3>
                                        <p className="text-gray-400 text-sm mb-4">
                                            Score <b>{syncedScore}</b> has been synchronized to the target network. 
                                            This address now holds global reputation status.
                                        </p>
                                        <div className="bg-black/40 p-3 rounded-lg flex items-center justify-between">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase">Relayer Tx Hash</span>
                                            <code className="text-[10px] text-cyan-400">{txHash.slice(0, 24)}...</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white text-xl">
                                        !
                                    </div>
                                    <p className="text-red-400 text-sm font-bold">Relay failed. Ensure the address has history on the source chain.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                        <div className="text-blue-500 mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-sm mb-2 uppercase">Signed Proofs</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">Relayers generate a cryptographic signature from the source chain validator set.</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                        <div className="text-purple-500 mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-sm mb-2 uppercase">Zero-Knowledge Relay</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">Proof of trust is relayed via ZK-SNARKs to hide the underlying transaction count.</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                        <div className="text-cyan-500 mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-sm mb-2 uppercase">Economic Settlement</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">Bridge fees are paid in $AV tokens to support the decentralized relayer set.</p>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default BridgePortal;
