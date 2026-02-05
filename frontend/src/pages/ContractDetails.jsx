import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateTrustScore } from "../api/client";
import PageWrapper from "../layout/PageWrapper";

function ContractDetails() {
  const { name, address } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState("0");
  const [targetAddress, setTargetAddress] = useState("");
  const [newScore, setNewScore] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Simulate fetching contract details (or fetch real balance via web3 if available in client)
    // For now, we assume address is passed correctly.
    // We could fetch additional metadata if needed.
    setTimeout(() => {
        setLoading(false);
    }, 500);
  }, [address]);

  const handleUpdateScore = async (e) => {
    e.preventDefault();
    if (!targetAddress || !newScore) return;
    
    setSubmitting(true);
    try {
        const result = await updateTrustScore(targetAddress, parseInt(newScore));
        alert(`Success: Trust Score updated for ${targetAddress}. Tx: ${result.txHash || 'Pending'}`);
        setNewScore("");
        setTargetAddress("");
    } catch (error) {
        console.error("Score update failed:", error);
        alert("Error updating score: " + error.message);
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <PageWrapper title="Contract Details"><div className="text-gray-400">Loading contract info...</div></PageWrapper>;

  return (
    <PageWrapper title={`Contract: ${name}`}>
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>
                <div className="flex items-center gap-2">
                    <code className="text-sm text-blue-400 font-mono bg-blue-900/10 px-2 py-1 rounded">{address}</code>
                    <a 
                        href={`https://etherscan.io/address/${address}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-gray-500 hover:text-white underline"
                    >
                        View External
                    </a>
                </div>
            </div>
            <div className="text-right">
                <div className="text-sm text-gray-500 uppercase font-bold">Status</div>
                <div className="text-green-400 font-bold flex items-center justify-end gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Active
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logic & Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="font-bold text-white mb-4 border-b border-gray-800 pb-2">Admin Actions</h3>
                
                {name === "TrustRegistry" ? (
                    <div className="space-y-6">
                        <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
                            <h4 className="text-sm font-bold text-blue-400 mb-3">🛠 Adjust Trust Score</h4>
                            <p className="text-xs text-gray-500 mb-4">
                                Manually override the trust score for a specific user. This action is recorded on-chain.
                            </p>
                            <form onSubmit={handleUpdateScore} className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Target User Address</label>
                                    <input 
                                        type="text" 
                                        placeholder="0x..." 
                                        value={targetAddress}
                                        onChange={e => setTargetAddress(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white font-mono focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">New Score (0-100)</label>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max="100" 
                                        placeholder="85" 
                                        value={newScore}
                                        onChange={e => setNewScore(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white font-mono focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className={`w-full py-2 rounded text-sm font-bold transition-colors ${
                                        submitting ? 'bg-gray-800 text-gray-500' : 'bg-blue-600 hover:bg-blue-500 text-white'
                                    }`}
                                >
                                    {submitting ? "Processing..." : "Update On-Chain"}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-500 text-sm italic p-4 text-center">
                        No specific admin actions available for this contract type.
                    </div>
                )}
            </div>

            {/* Metadata / Logs */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="font-bold text-white mb-4 border-b border-gray-800 pb-2">Contract Metadata</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Network</span>
                        <span className="text-white">Ethereum (Local/Testnet)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Compiler</span>
                        <span className="text-white">Solidity 0.8.20</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500">Optimization</span>
                        <span className="text-white">Enabled (200 runs)</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default ContractDetails;
