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
                <thead className="bg-gray-800/50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="p-4">User Address</th>
                    <th className="p-4">Trust Score</th>
                    <th className="p-4">Status</th>

                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-500 italic">No registered users found</td>
                    </tr>
                  ) : (
                    users.map((u, i) => (
                      <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                        <td className="p-4 font-mono text-xs text-gray-300">
                          {u.address.slice(0, 10)}...{u.address.slice(-8)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                             <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full ${u.trustScore >= 0.8 ? "bg-green-500" : u.trustScore >= 0.4 ? "bg-yellow-500" : "bg-red-500"}`}
                                 style={{ width: `${(u.trustScore || 0.5) * 100}%` }}
                               ></div>
                             </div>
                             <span className="text-sm font-bold text-white">{(u.trustScore || 0.5).toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.trustScore >= 0.8 ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                            {u.trustScore >= 0.8 ? "Verified" : "Under Review"}
                          </span>
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
