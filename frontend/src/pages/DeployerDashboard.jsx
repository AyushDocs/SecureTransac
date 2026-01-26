import { useEffect, useState } from "react";
import { deleteAuthorityMetadata, fetchAuthorities, saveAuthorityMetadata, setAuthorityStatus, setReporterStatus } from "../api/client";
import { CONTRACT_ADDRESSES } from "../api/config";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

const ContractRow = ({ name, addr }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-950 rounded-lg border border-gray-800/50 hover:border-blue-500/30 transition-colors">
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
  const [loading, setLoading] = useState(true);
  const [newAuth, setNewAuth] = useState({ address: "", name: "", email: "" });
  const [systemHealth, setSystemHealth] = useState({ status: "OPTIONAL_UPGRADE", latency: "24ms", gas: "12 Gwei" });
  
  const isAdmin = (activeRole || role) === 'admin' || (activeRole || role) === 'deployer'; 

  useEffect(() => {
    async function loadAuths() {
      try {
        const data = await fetchAuthorities();
        logger.info("DeployerDashboard: Loaded authorities", data);
        setAuthorities(data);
      } catch (error) {
        logger.error("DeployerDashboard: Failed to load authorities", error);
      } finally {
        setLoading(false);
      }
    }
    loadAuths();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      console.log("Authorizing reporter on-chain...", newAuth.address);
      if (!newAuth.address) throw new Error("Address is required");
      
      await setReporterStatus(newAuth.address, true);
      await setAuthorityStatus(newAuth.address, true);
      await saveAuthorityMetadata(newAuth.address, newAuth.name, newAuth.email);
      
      alert("Reporter authorized successfully!");
      setNewAuth({ address: "", name: "", email: "" });
      const data = await fetchAuthorities();
      setAuthorities(data);
    } catch (error) {
      console.error(error);
      alert(`Failed to authorize: ${error.message}`);
    }
  };

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
               <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400">Mainnet (Fork)</span>
             </div>
             <div className="p-4 space-y-3">
                {Object.entries(CONTRACT_ADDRESSES).map(([name, addr]) => (
                   <ContractRow key={name} name={name} addr={addr} />
                ))}

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

        {/* Right Col: Admin Actions */}
        <div className="space-y-6">
           <div className="bg-gray-900 border border-blue-600/20 p-6 rounded-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
             </div>
             <h3 className="text-lg font-bold text-white mb-4 relative z-10">Authorize New Operator</h3>
             <form onSubmit={handleRegister} className="space-y-4 relative z-10">
               <input 
                 type="text" 
                 placeholder="Operator Name" 
                 value={newAuth.name}
                 onChange={e => setNewAuth({...newAuth, name: e.target.value})}
                 className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-sm text-white"
                 required
               />
               <input 
                 type="text" 
                 placeholder="Wallet Address (0x...)" 
                 value={newAuth.address}
                 onChange={e => setNewAuth({...newAuth, address: e.target.value})}
                 className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-sm text-white font-mono"
                 required
               />
               <input 
                 type="email" 
                 placeholder="Contact Email" 
                 value={newAuth.email}
                 onChange={e => setNewAuth({...newAuth, email: e.target.value})}
                 className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-sm text-white"
                 required
               />
               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition-colors text-sm">
                 Grant Permissions
               </button>
             </form>
           </div>
           
           <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
              <h3 className="font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                 <button className="w-full text-left px-4 py-3 bg-gray-950 hover:bg-gray-800 rounded border border-gray-800 text-sm text-gray-300 transition-colors flex justify-between group">
                    <span>⏸ Pause Protocol</span>
                    <span className="text-gray-600 group-hover:text-white">→</span>
                 </button>
                 <button className="w-full text-left px-4 py-3 bg-gray-950 hover:bg-gray-800 rounded border border-gray-800 text-sm text-gray-300 transition-colors flex justify-between group">
                    <span>📦 Upgrade Proxy</span>
                    <span className="text-gray-600 group-hover:text-white">→</span>
                 </button>
                 <button className="w-full text-left px-4 py-3 bg-gray-950 hover:bg-gray-800 rounded border border-gray-800 text-sm text-gray-300 transition-colors flex justify-between group">
                    <span>⛽ Adjust Gas Limits</span>
                    <span className="text-gray-600 group-hover:text-white">→</span>
                 </button>
              </div>
           </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default DeployerDashboard;
