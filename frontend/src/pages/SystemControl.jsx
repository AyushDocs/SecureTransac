import { useEffect, useState } from "react";
import { fetchCurrentUser, getContractMaintainer, getContractsByMaintainer, setContractThreshold, submitManualOverride } from "../api/client";
import PageWrapper from "../layout/PageWrapper";

function SystemControl() {
  const [searchAddr, setSearchAddr] = useState("");
  const [targetScore, setTargetScore] = useState(500);
  const [reason, setReason] = useState("");
  const [overriding, setOverriding] = useState(false);

  // Contract Management State
  const [contractAddr, setContractAddr] = useState("");
  const [minScore, setMinScore] = useState(70);
  const [settingThreshold, setSettingThreshold] = useState(false);
  const [maintainer, setMaintainer] = useState(null);
  const [myContracts, setMyContracts] = useState([]);
  const [isDropdown, setIsDropdown] = useState(true);

  // Load user's contracts on mount
  useEffect(() => {
    async function loadUserContracts() {
      try {
        const user = await fetchCurrentUser();
        if (user && user.walletAddress) {
          const contracts = await getContractsByMaintainer(user.walletAddress);
          setMyContracts(contracts || []);
        }
      } catch (error) {
        console.error("Failed to load user contracts", error);
      }
    }
    loadUserContracts();
  }, []);

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

  const handleSetThreshold = async (e) => {
    e.preventDefault();
    if (!contractAddr) return;
    setSettingThreshold(true);
    try {
      await setContractThreshold(contractAddr, minScore);
      alert(`Success! Policy updated for ${contractAddr}`);
      
      // Refresh list if it's a new one
      if (!myContracts.includes(contractAddr)) {
         setMyContracts(prev => [...prev, contractAddr]);
      }
      
      const m = await getContractMaintainer(contractAddr);
      setMaintainer(m);
    } catch (error) {
       console.error(error);
       alert("Failed to set threshold. Ensure you are the maintainer.");
    } finally {
      setSettingThreshold(false);
    }
  };

  return (
    <PageWrapper title="System Controls">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* CONTRACT PROTECTION SECTION */}
        <div className="bg-gray-900 border border-blue-500/30 p-6 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.05)]">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-500">🛡️</span> Contract Protection
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Manage trust policies for your contracts. You can select existing contracts you maintain or claim a new one.
            </p>

            <form onSubmit={handleSetThreshold} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-300">Target Contract</label>
                    <button 
                      type="button" 
                      onClick={() => setIsDropdown(!isDropdown)}
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      {isDropdown ? "Enter Address Manually" : "Select from My Contracts"}
                    </button>
                </div>
                
                {isDropdown && myContracts.length > 0 ? (
                  <select
                    value={contractAddr}
                    onChange={(e) => setContractAddr(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Select a Contract --</option>
                    {myContracts.map(addr => (
                      <option key={addr} value={addr}>{addr}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text"
                    value={contractAddr}
                    onChange={(e) => setContractAddr(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="0x..."
                    required
                  />
                )}
                
                 {maintainer && (
                  <p className="text-xs text-gray-500 mt-2">
                    Current Maintainer: <span className="font-mono text-blue-400">{maintainer}</span>
                  </p>
                )}
              </div>
              
              <div>
                 <label className="block text-sm font-bold text-gray-300 mb-2">Min. Trust Score: {minScore}</label>
                 <div className="flex items-center gap-4">
                    <input 
                      type="range" min="0" max="100" step="1"
                      value={minScore} 
                      onChange={(e) => setMinScore(e.target.value)}
                      className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-xl font-bold text-white w-12 text-center">{minScore}</span>
                 </div>
                 <p className="text-xs text-gray-500 mt-2">Users below this score cannot interact w/ your contract.</p>
              </div>

              <div className="flex items-end">
                <button 
                  type="submit"
                  disabled={settingThreshold}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {settingThreshold ? "Confirming..." : "Set Threshold"}
                </button>
              </div>
            </form>
        </div>

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
