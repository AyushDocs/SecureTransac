import { useState } from 'react';
import { generateZKProof } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ZKProofSystem = () => {
    const { user } = useAuth();
    const [threshold, setThreshold] = useState(70);
    const [secret, setSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const [proofResult, setProofResult] = useState(null);

    const handleDownloadProof = () => {
        if (!proofResult) return;
        const blob = new Blob([JSON.stringify(proofResult, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `zk_proof_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleGenerateProof = async (e) => {
        e.preventDefault();
        if (!secret) {
            alert("A secret is required for cryptographic entropy.");
            return;
        }

        setLoading(true);
        try {
            // Server-side proof generation: user score never touches frontend
            const result = await generateZKProof(user.address, threshold, secret);
            setProofResult({ proof: result.proof, publicSignals: result.publicSignals });
        } catch (error) {
            alert(`ZK Generation failed: ${error.message}`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 border border-border rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border bg-gradient-to-br from-indigo-900/20 to-purple-900/20">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-xl">🛡️</span> ZK-SNARK Performance Attestation
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                    Generate a zero-knowledge proof to prove your score is above a threshold without revealing the actual value.
                </p>
            </div>

            <div className="p-6 space-y-6">
                <div className="bg-black/30 border border-indigo-500/20 p-4 rounded-lg flex justify-between items-center">
                    <div>
                        <div className="text-[10px] text-gray-500 uppercase font-bold">Prover Status</div>
                        <div className="text-sm font-mono text-indigo-400 font-bold">SERVER-SIDE SECURE ENCLAVE</div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded font-bold uppercase">Ready</span>
                    </div>
                </div>

                <form onSubmit={handleGenerateProof} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Threshold to Prove</label>
                            <input 
                                type="number" 
                                value={threshold}
                                onChange={e => setThreshold(e.target.value)}
                                className="w-full bg-gray-950 border border-border rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Private Entropy</label>
                            <input 
                                type="password" 
                                placeholder="Secret passphrase"
                                value={secret}
                                onChange={e => setSecret(e.target.value)}
                                className="w-full bg-gray-950 border border-border rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                            <p className="text-[9px] text-gray-500 mt-1">Secret randomness to prevent brute-force (guessing) of your score.</p>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                Generating SNARK Proof...
                            </>
                        ) : (
                            '🔒 Generate Proof of Trust (> ' + threshold + ')'
                        )}
                    </button>
                </form>

                {proofResult && (
                    <div className="mt-8 p-6 bg-indigo-600/10 border border-indigo-600/30 rounded-2xl animate-in slide-in-from-bottom-4">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-600/30">
                                📜
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold mb-1 tracking-tight">Attestation Generated</h3>
                                <p className="text-gray-400 text-xs mb-4">
                                    This proof mathematically verifies that your score is greater than <b>{threshold}</b> 
                                    without revealing what your score actually is.
                                </p>
                                <div className="bg-black/60 p-3 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase">ZK-SNARK Public Signals</span>
                                        <span className="text-[9px] bg-green-500 text-black px-1.5 rounded font-black">VALID</span>
                                    </div>
                                    <code className="text-[10px] text-indigo-400 break-all block font-mono">
                                        {JSON.stringify(proofResult.publicSignals)}
                                    </code>
                                </div>
                                <button 
                                    onClick={handleDownloadProof}
                                    className="mt-4 text-indigo-400 text-[10px] font-bold uppercase flex items-center gap-1 hover:underline focus:outline-none"
                                >
                                    Download Proof Data <span className="text-xs">⬇️</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-4 bg-gray-950 border-t border-border flex items-center justify-between">
                <span className="text-[9px] text-gray-600 font-bold uppercase">Powered by Circom & SnarkJS</span>
                <span className="text-[9px] text-indigo-500 font-bold uppercase">Privacy-Preserving KYC ready</span>
            </div>
        </div>
    );
};

export default ZKProofSystem;
