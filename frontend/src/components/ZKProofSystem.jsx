import { useState } from 'react';
import { generateZKProof, verifyZKProof } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ZKProofSystem = () => {
    const { user } = useAuth();
    const [mode, setMode] = useState('generate'); // 'generate' or 'verify'
    const [threshold, setThreshold] = useState(70);
    const [secret, setSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const [proofResult, setProofResult] = useState(null);
    
    // Verification states
    const [verifyFile, setVerifyFile] = useState(null);
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifyError, setVerifyError] = useState(null);

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
            const result = await generateZKProof(user.address, threshold, secret);
            setProofResult({ proof: result.proof, publicSignals: result.publicSignals });
        } catch (error) {
            alert(`ZK Generation failed: ${error.message}`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyProof = async () => {
        if (!verifyFile) return;
        setLoading(true);
        setVerifyError(null);
        setVerifyResult(null);

        try {
            const text = await verifyFile.text();
            const data = JSON.parse(text);
            if (!data.proof || !data.publicSignals) throw new Error("Invalid format");
            
            const res = await verifyZKProof(data.proof, data.publicSignals);
            setVerifyResult(res.valid);
        } catch (err) {
            setVerifyError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 border border-border rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border bg-gradient-to-br from-indigo-900/20 to-purple-900/20">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-xl">🛡️</span> ZK-SNARK Attestation
                    </h2>
                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                        <button 
                            onClick={() => setMode('generate')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${mode === 'generate' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Generate
                        </button>
                        <button 
                            onClick={() => setMode('verify')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${mode === 'verify' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Verify
                        </button>
                    </div>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                    {mode === 'generate' 
                        ? "Generate a zero-knowledge proof to prove your score meets a requirement without revealing it."
                        : "Upload a trust attestation JSON file to verify its mathematical validity."}
                </p>
            </div>

            <div className="p-6 space-y-6">
                {mode === 'generate' ? (
                    <>
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
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                            >
                                {loading ? 'Generating SNARK Proof...' : '🔒 Generate Proof of Trust (> ' + threshold + ')'}
                            </button>
                        </form>

                        {proofResult && (
                            <div className="mt-4 p-6 bg-indigo-600/10 border border-indigo-600/30 rounded-2xl animate-in slide-in-from-bottom-4">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl">📜</div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold mb-1">Attestation Generated</h3>
                                        <p className="text-gray-400 text-[10px] mb-4">Proof verified that score &gt; {threshold}.</p>
                                        <button 
                                            onClick={handleDownloadProof}
                                            className="text-indigo-400 text-[10px] font-bold hover:underline"
                                        >
                                            Download JSON Proof ⬇️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors relative cursor-pointer">
                            <input 
                                type="file" 
                                accept=".json" 
                                onChange={(e) => setVerifyFile(e.target.files[0])}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="text-2xl mb-2">📥</div>
                            <p className="text-gray-400 text-xs">{verifyFile ? verifyFile.name : "Drop ZK Proof JSON here"}</p>
                        </div>

                        <button
                            onClick={handleVerifyProof}
                            disabled={!verifyFile || loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : "Verify Proof File"}
                        </button>

                        {verifyResult !== null && (
                            <div className={`p-4 rounded-xl border flex items-center gap-3 ${verifyResult ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                                <span>{verifyResult ? "✅" : "❌"}</span>
                                <div className="text-sm font-bold">{verifyResult ? "Valid Proof" : "Invalid/Forged Proof"}</div>
                            </div>
                        )}
                        
                        {verifyError && <div className="text-red-500 text-[10px] font-mono">{verifyError}</div>}
                    </div>
                )}
            </div>
            
            <div className="p-4 bg-gray-950 border-t border-border flex items-center justify-between">
                <span className="text-[9px] text-gray-600 font-bold uppercase">Groth16 Verifier</span>
                <span className="text-[9px] text-indigo-500 font-bold uppercase">Privacy-Preserving KYC</span>
            </div>
        </div>
    );
};

export default ZKProofSystem;
