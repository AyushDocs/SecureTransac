import { useState } from 'react';
import { verifyZKProof } from '../api/client';

const ProofVerifierTool = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
            setError(null);
        }
    };

    const handleVerify = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.proof || !data.publicSignals) {
                throw new Error("Invalid JSON format. Expected { proof, publicSignals }");
            }

            const response = await verifyZKProof(data.proof, data.publicSignals);
            setResult(response.valid);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to process proof file.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span>🔍</span> Offline Proof Verifier
            </h3>
            <p className="text-gray-500 text-xs mb-6">
                Upload a ZK-SNARK JSON file to verify its mathematical integrity against system circuits.
            </p>

            <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer relative group">
                    <input 
                        type="file" 
                        accept=".json" 
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="text-3xl mb-2 opacity-40 group-hover:scale-110 transition-transform">📄</div>
                    <p className="text-gray-400 text-xs font-medium">
                        {file ? file.name : "Click to select or drag identity_proof.json"}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-2 font-mono uppercase tracking-widest">Supports SnarkJS JSON</p>
                </div>

                <button
                    onClick={handleVerify}
                    disabled={!file || loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                >
                    {loading ? "Verifying SNARK..." : "Verify Proof Integrity"}
                </button>

                {result !== null && (
                    <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 animate-in zoom-in-95 ${
                        result ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}>
                        <div className={`text-xl ${result ? "text-green-500" : "text-red-500"}`}>
                            {result ? "✅" : "❌"}
                        </div>
                        <div>
                            <div className="text-sm font-bold">{result ? "Verification Successful" : "Verification Failed"}</div>
                            <p className="text-[10px] opacity-70">
                                {result 
                                    ? "This proof accurately corresponds to the system circuits and public signals." 
                                    : "The provided proof is mathematically inconsistent with the verification key."}
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-950/20 border border-red-900 rounded-xl text-red-500 text-xs font-mono">
                        <span className="font-bold mr-2">ERROR:</span> {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProofVerifierTool;
