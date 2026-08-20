import { useState } from "react";
import { submitManualOverride } from "../api/client";
import PageWrapper from "../layout/PageWrapper";

function SystemControl() {
  const [searchAddr, setSearchAddr] = useState("");
  const [targetScore, setTargetScore] = useState(500);
  const [reason, setReason] = useState("");
  const [overriding, setOverriding] = useState(false);

  const handleManualOverride = async (e) => {
    e.preventDefault();
    if (!searchAddr || !reason) return;
    setOverriding(true);
    try {
      const scoreFloat = targetScore / 1000;
      await submitManualOverride(searchAddr, "manual", reason, scoreFloat);
      alert("Manual override successful! User score has been pushed instantly.");
      setSearchAddr("");
      setReason("");
    } catch (error) {
      alert("Failed to apply override");
    } finally {
      setOverriding(false);
    }
  };

  return (
    <PageWrapper title="System Controls">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* ONE SHOT SCORE PUSH SECTION */}
        <div className="bg-gray-900 border border-purple-500/30 p-6 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.05)]">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-purple-500">⚡</span> One-Shot Score Push
            </h2>
            <p className="text-gray-400 text-sm mb-6">Instantly adjust any user's trust score. This bypasses the normal AI progression logic.</p>
            
            <form onSubmit={handleManualOverride} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">User Address</label>
                <input 
                  type="text"
                  value={searchAddr}
                  onChange={(e) => setSearchAddr(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-xs font-mono focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="0x..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Target Score: {targetScore}</label>
                <input 
                  type="range" min="0" max="1000" step="10"
                  value={targetScore} 
                  onChange={(e) => setTargetScore(e.target.value)}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Justification</label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="Reason for manual adjustment..."
                  rows="3"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={overriding}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {overriding ? "Processing..." : "Push Score Update"}
              </button>
            </form>
          </div>
      </div>
    </PageWrapper>
  );
}

export default SystemControl;
