import { useEffect, useState } from "react";
import { fetchACL } from "../api/client";
import ScoreSearchWidget from "../components/ScoreSearchWidget";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

function CompanyDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportText, setReportText] = useState("");

  async function loadData() {
    if (!user?.address) return;
    try {
      const [aclData] = await Promise.all([
        fetchACL()
      ]);
      setUsers(aclData);
    } catch (error) {
      logger.error("CompanyDashboard: Failed to load data", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user?.address]);

  if (loading) return <PageWrapper title="Company Portal"><div className="text-gray-400">Loading...</div></PageWrapper>;

  return (
    <PageWrapper title="Company Admin Portal">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Verified Users</h2>
                <p className="text-gray-400 text-sm">Monitor users registered with your authority.</p>
              </div>
              <div className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-xs font-bold">
                Trusted Reporter Active
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-800/50 text-gray-500 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="p-4">Business Identity</th>
                    <th className="p-4">Risk Category</th>
                    <th className="p-4">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-gray-500 italic">No registered users found</td>
                    </tr>
                  ) : (
                    users.map((u, i) => (
                      <tr key={i} className="hover:bg-gray-800/30 transition-colors group">
                        <td className="p-4">
                          <div className="font-mono text-[10px] text-gray-400 mb-1 group-hover:text-blue-400 transition-colors">
                            {u.address.slice(0, 16)}...{u.address.slice(-12)}
                          </div>
                          <div className="text-[9px] text-gray-600 uppercase font-bold tracking-tighter">On-Chain Identity Verified</div>
                        </td>
                        <td className="p-4">
                           <div className="flex items-center gap-3">
                              <span className={`w-2 h-2 rounded-full ${u.trustScore >= 0.8 ? "bg-green-500" : u.trustScore >= 0.4 ? "bg-yellow-500" : "bg-red-500"}`}></span>
                              <div className="flex flex-col">
                                <span className={`text-[11px] font-black uppercase ${u.trustScore >= 0.8 ? "text-green-500" : u.trustScore >= 0.4 ? "text-yellow-500" : "text-red-500"}`}>
                                  {u.trustScore >= 0.8 ? "Low Risk" : u.trustScore >= 0.4 ? "Medium Risk" : "High Risk"}
                                </span>
                                <span className="text-[9px] text-gray-600 font-bold blur-[2px] select-none pointer-events-none">RAW: {(u.trustScore || 0).toFixed(4)}</span>
                              </div>
                           </div>
                        </td>
                        <td className="p-4">
                          <button 
                            onClick={() => alert("Upgrade to Institutional Tier for Full Data Access & Raw Score Decryption keys.")}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border border-gray-700 active:scale-95"
                          >
                            Get Raw Data 🔓
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
            <ScoreSearchWidget />
        </div>
      </div>
    </PageWrapper>
  );
}

export default CompanyDashboard;
