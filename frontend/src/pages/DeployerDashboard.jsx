import { useEffect, useState } from "react";
import { deleteAuthorityMetadata, fetchAuthorities, saveAuthorityMetadata, setAuthorityStatus, setReporterStatus } from "../api/client";
import AdminScoreViewer from "../components/AdminScoreViewer";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

function DeployerDashboard() {
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAuth, setNewAuth] = useState({ address: "", name: "", email: "" });

  useEffect(() => {
    async function loadAuths() {
      try {
        const data = await fetchAuthorities();
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
      // Step 1: On-chain Authorization
      console.log("Authorizing reporter on-chain...");
      await setReporterStatus(newAuth.address, true);
      
      console.log("Authorizing authority for IdentityVault on-chain...");
      await setAuthorityStatus(newAuth.address, true);

      // Step 2: Metadata persistence on backend
      await saveAuthorityMetadata(newAuth.address, newAuth.name, newAuth.email);
      
      alert("Reporter authorized on-chain and registered successfully!");
      setNewAuth({ address: "", name: "", email: "" });
      const data = await fetchAuthorities();
      setAuthorities(data);
    } catch (error) {
      console.error(error);
      alert("Failed to authorize reporter. Ensure you are the contract owner.");
    }
  };

  const handleRevoke = async (address) => {
    if (!confirm("Are you sure you want to revoke this reporter's authority? This will remove them from the blockchain and local records.")) return;
    try {
      // Step 1: On-chain Revocation
      console.log("Revoking reporter on-chain...");
      await setReporterStatus(address, false);
      
      console.log("Revoking authority for IdentityVault on-chain...");
      await setAuthorityStatus(address, false);

      // Step 2: Metadata removal
      await deleteAuthorityMetadata(address);
      
      alert("Authority revoked on-chain and locally.");
      const data = await fetchAuthorities();
      setAuthorities(data);
    } catch (error) {
      console.error(error);
      alert("Failed to revoke authority.");
    }
  };

  if (loading) return <PageWrapper title="Deployer Portal"><div className="text-gray-400">Loading...</div></PageWrapper>;

  return (
    <PageWrapper title="SecureTransac: Contract Deployer Portal">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Authorized Reporters</h2>
              <p className="text-gray-400 text-sm">Entities authorized to influence global trust scores.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-800/50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Address</th>
                    <th className="p-4">Level</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {(Array.isArray(authorities) ? authorities : []).map((auth, i) => (
                    <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <div className="text-white font-bold">{auth.name}</div>
                        <div className="text-gray-500 text-xs">{auth.email}</div>
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-400">{auth.address}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase">
                          {auth.level || "Verified"}
                        </span>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleRevoke(auth.address)}
                          className="text-red-500 hover:text-red-400 text-sm font-medium"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <AdminScoreViewer />

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4">Register New Reporter</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Entity Name</label>
                <input 
                  type="text"
                  value={newAuth.name}
                  onChange={(e) => setNewAuth({...newAuth, name: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Company Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Wallet Address</label>
                <input 
                  type="text"
                  value={newAuth.address}
                  onChange={(e) => setNewAuth({...newAuth, address: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="0x..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Contact Email</label>
                <input 
                  type="email"
                  value={newAuth.email}
                  onChange={(e) => setNewAuth({...newAuth, email: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="contact@entity.io"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Authorize Reporter
              </button>
            </form>
          </div>

          <div className="bg-gray-900 border border-blue-500/20 p-6 rounded-xl">
             <h2 className="text-xl font-bold text-white mb-2">Dynamic Trust Engine</h2>
             <p className="text-gray-400 text-sm mb-4">You can adjust the global weights for AI scoring algorithms here.</p>
             <div className="space-y-3">
               <div className="flex justify-between text-xs text-gray-500">
                 <span>Transaction Weight</span>
                 <span className="text-blue-400">0.02x</span>
               </div>
               <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                 <div className="w-[40%] h-full bg-blue-500"></div>
               </div>
               <div className="flex justify-between text-xs text-gray-500">
                 <span>Complaint Penalty</span>
                 <span className="text-red-400">0.15x</span>
               </div>
               <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                 <div className="w-[75%] h-full bg-red-500"></div>
               </div>
             </div>
             <button className="w-full mt-6 border border-gray-700 hover:bg-gray-800 text-gray-400 py-2 rounded-lg text-sm transition-colors">
               Update AI Parameters
             </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default DeployerDashboard;
