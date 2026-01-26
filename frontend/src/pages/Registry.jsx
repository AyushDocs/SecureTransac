import { useEffect, useState } from "react";
import { fetchACL, fetchCurrentUser, fetchScoreUpdates, getContractsByMaintainer, setContractThreshold } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../layout/PageWrapper";
import ACLTable from "../registry/ACLTable";
import LiveFeed from "../registry/LiveFeed";
import ThresholdSlider from "../registry/ThresholdSlider";
import { logger } from "../utils/logger";

// Registry management page
function Registry() {
  const { activeRole, role } = useAuth();
  const currentRole = activeRole || role;
  const isSystemDev = ["admin", "deployer"].includes(currentRole);

  const [threshold, setThreshold] = useState(0.50); // Default neutral
  const [aclEntries, setAclEntries] = useState([]);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Contract Logic
  const [myContracts, setMyContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [aclData, updatesData] = await Promise.all([
          fetchACL(),
          fetchScoreUpdates()
        ]);
        
        const classified = aclData
          .filter(e => e.trustScore >= 0.8 || e.trustScore <= 0.2)
          .map(e => ({
            address: e.address,
            type: e.trustScore >= 0.8 ? 'whitelist' : 'blacklist',
            addedBy: e.addedBy,
            date: e.date
          }));
        setAclEntries(classified);

        const formatted = updatesData.map(u => {
          const diff = Date.now() - u.timestamp;
          const minutes = Math.floor(diff / 60000);
          let timestamp;
          if (minutes < 1) timestamp = "Just now";
          else if (minutes < 60) timestamp = `${minutes} min ago`;
          else {
            const hours = Math.floor(minutes / 60);
            timestamp = `${hours} hour${hours > 1 ? 's' : ''} ago`;
          }
          return {
            address: `${u.address.slice(0, 6)}...${u.address.slice(-4)}`,
            oldScore: u.oldScore,
            newScore: u.newScore,
            timestamp
          };
        });
        setLiveUpdates(formatted);

        // Load contracts if dev
        if (isSystemDev) {
           const user = await fetchCurrentUser();
           if (user?.walletAddress) {
             const contracts = await getContractsByMaintainer(user.walletAddress);
             setMyContracts(contracts || []);
             if (contracts && contracts.length > 0) {
                setSelectedContract(contracts[0]);
             }
           }
        }

      } catch (error) {
        logger.error("Failed to load Registry data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isSystemDev]);

  const handleRemove = (address) => {
    console.log("Remove address:", address);
  };

  const handleThresholdChange = async (value) => {
    setThreshold(value); // Update UI instantly
    
    // Auto-save debounced or on release?
    // For safety, let's just log here. Use a separate confirm button or rely on the slider's 'onCommit'.
    // ThresholdSlider component calls onChange on commit (mouseUp).
    
    if (!selectedContract) {
       if (isSystemDev) alert("Please select a contract to apply this threshold to.");
       return;
    }

    try {
      setIsUpdating(true);
      // Convert 0.0-1.0 to 0-100 integer
      const scoreInt = Math.floor(value * 100);
      await setContractThreshold(selectedContract, scoreInt);
      logger.info(`Updated threshold for ${selectedContract} to ${scoreInt}`);
      // alert("Threshold updated on-chain!"); 
      // Using alert might be annoying on slider drag end, maybe a toast is better, but alert ensures confirmation.
    } catch (error) {
      alert("Failed to update threshold on-chain");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Registry Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading ACL...</div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Registry Management">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ACLTable entries={aclEntries} onRemove={handleRemove} />
        </div>
        <div className="space-y-6">
          {isSystemDev ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Target Contract</label>
                {myContracts.length > 0 ? (
                  <select 
                    className="w-full bg-gray-950 border border-gray-800 rounded text-sm text-white p-2 outline-none focus:border-blue-500"
                    value={selectedContract}
                    onChange={(e) => setSelectedContract(e.target.value)}
                  >
                    {myContracts.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                   <p className="text-sm text-gray-500 italic">No contracts claimed yet. Go to System Controls to claim one.</p>
                )}
              </div>
              
              <ThresholdSlider
                value={threshold}
                onChange={handleThresholdChange}
                disabled={!selectedContract || isUpdating}
                label="Contract Boundary"
              />
              {isUpdating && <p className="text-xs text-blue-400 mt-2 animate-pulse">Syncing with blockchain...</p>}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 opacity-50">
               <h3 className="text-lg font-semibold text-white mb-2">Trust Boundary</h3>
               <p className="text-sm text-gray-500">Only System Developers can modify trust boundaries for contracts.</p>
            </div>
          )}
          
          <LiveFeed updates={liveUpdates} />
        </div>
      </div>
    </PageWrapper>
  );
}

export default Registry;
