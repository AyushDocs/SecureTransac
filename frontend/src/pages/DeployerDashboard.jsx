import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteAuthorityMetadata, fetchAuthorities, fetchNetworkStats, fetchSystemContracts, setAuthorityStatus, setReporterStatus } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

const ContractRow = ({ name, addr }) => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
        onClick={() => navigate(`/admin/contract/${name}/${addr}`)}
        className="flex items-center justify-between p-3 bg-gray-950 rounded-lg border border-gray-800/50 hover:border-blue-500/30 hover:bg-gray-900 cursor-pointer transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center text-lg">📜</div>
        <div>
          <div className="font-bold text-white text-sm">{name}</div>
          <div className="text-[10px] text-green-500 font-mono">0.8.20 • Immutable</div>
        </div>
      </div>
      <div className="text-right">
        <code className="text-xs text-gray-400 font-mono block mb-1">{addr}</code>
        <div className="flex justify-end gap-2">
          <a 
            href={`https://etherscan.io/address/${addr}`} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] uppercase font-bold text-cyan-500 cursor-pointer hover:underline"
          >
            View on Explorer
          </a>
          <span className="text-[10px] uppercase font-bold text-gray-600">|</span>
          <button 
            className={`text-[10px] uppercase font-bold transition-all ${
              copied ? "text-green-500 scale-110" : "text-gray-500 hover:text-white"
            }`} 
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
};

function DeployerDashboard() {
  const { activeRole, role } = useAuth();
  const [authorities, setAuthorities] = useState([]);
  const [contracts, setContracts] = useState({});
  const [loading, setLoading] = useState(true);

  const [systemHealth, setSystemHealth] = useState({ status: "OPTIONAL_UPGRADE", latency: "24ms", gas: "12 Gwei" });
  const [isPaused, setIsPaused] = useState(false);
  
  useEffect(() => {
    async function loadData() {
      const startTime = Date.now();
      try {
        const [authData, contractData, statsData, sysStatus] = await Promise.all([
            fetchAuthorities(),
            fetchSystemContracts(),
            fetchNetworkStats(),
            fetchSystemStatus()
        ]);
        
        const latency = Date.now() - startTime;
        
        logger.info("DeployerDashboard: Loaded data", { authData, contractData, statsData });
        setAuthorities(authData);
        setContracts(contractData);
        
        if (sysStatus) setIsPaused(sysStatus.isPaused);
        
        if (statsData) {
            setSystemHealth({
                status: sysStatus?.isPaused ? "PAUSED" : (statsData.status || "OPERATIONAL"),
                latency: `${latency}ms`,
                gas: statsData.gasPrice || "Unknown"
            });
        }
      } catch (error) {
        logger.error("DeployerDashboard: Failed to load data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);






  const handleRevoke = async (address) => {
    console.log("Revoke requested for:", address);
    if (!address) {
        alert("Error: Cannot revoke unknown address");
        return;
    }
    
    if (!confirm(`Confirm revocation of access for ${address}?`)) return;
    try {
      await setReporterStatus(address, false);
      await setAuthorityStatus(address, false);
      await deleteAuthorityMetadata(address);
      
      alert("Authority revoked.");
      const data = await fetchAuthorities();
      setAuthorities(data);
    } catch (error) {
      console.error(error);
      alert(`Failed to revoke authority: ${error.message}`);
    }
  };

  if (loading) return <PageWrapper title="System Operations"><div className="text-gray-400">Initializing System View...</div></PageWrapper>;

  return (
    <PageWrapper title="SecureTransac: Network Infrastructure">
      
      {/* Infrastructure Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
         <div className="bg-gray-900 border border-green-500/20 p-4 rounded-xl flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">System Health</div>
            <div className="text-xl font-bold text-green-400">OPERATIONAL</div>
            <div className="text-xs text-green-500/60 mt-1">All contracts responding</div>
         </div>
         <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Network Latency</div>
            <div className="text-xl font-bold text-white">{systemHealth.latency}</div>
         </div>
         <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Current Gas Price</div>
            <div className="text-xl font-bold text-white">{systemHealth.gas}</div>
         </div>
         <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Reporters Active</div>
            <div className="text-xl font-bold text-blue-400">{authorities.length}</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Contract Addresses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
             <div className="p-6 border-b border-gray-800 flex justify-between items-center">
               <h3 className="font-bold text-white">Deployed Contracts</h3>
               <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400">System Active</span>
             </div>
             <div className="p-4 space-y-3">
                {Object.keys(contracts).length > 0 ? (
                    Object.entries(contracts).map(([name, addr]) => (
                       <ContractRow key={name} name={name} addr={addr} />
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-8 text-sm italic border border-dashed border-gray-800 rounded-lg">
                        No active contracts found on this network.
                    </div>
                )}
             </div>
          </div>

          {/* Core Access Control List */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Access Control Registry</h2>
              <p className="text-gray-400 text-xs">Manage reporter permissions for TrustRegistry & IdentityVault.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-800/50 text-gray-500 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-4">Entity</th>
                    <th className="p-4">Address</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm">
                  {authorities.map((auth, i) => (
                    <tr key={i} className="hover:bg-gray-800/20">
                      <td className="p-4 font-medium text-white">{auth.name}</td>
                      <td className="p-4 font-mono text-gray-400 text-xs">{auth.address}</td>
                      <td className="p-4"><span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-[10px] font-bold">REPORTER</span></td>
                      <td className="p-4"><span className="text-green-500 text-xs flex items-center gap-1">● Active</span></td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleRevoke(auth.address)} className="text-red-500 hover:text-red-400 text-xs font-bold uppercase">Revoke</button>
                      </td>
                    </tr>
                  ))}
                  {authorities.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-gray-500 italic">No reporters authorized yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>


      </div>
    </PageWrapper>
  );
}

export default DeployerDashboard;
