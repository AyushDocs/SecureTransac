import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchAddress } from "../api/client";
import CreditBalance from "../components/CreditBalance";
import MyScoreWidget from "../components/MyScoreWidget";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user?.address) return;
      try {
        const data = await searchAddress(user.address);
        setUserData(data);
      } catch (error) {
        logger.error("UserDashboard: Failed to load data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.address]);

  if (loading) return <PageWrapper title="User Dashboard"><div className="text-gray-400">Loading profile...</div></PageWrapper>;

  return (
    <PageWrapper title="My Trust Profile">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Hello, {userData?.name || userData?.metadata?.name || user?.name || "Explorer"}</h1>
            <p className="text-gray-500 font-medium">Your decentralized reputation and security hub.</p>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={() => navigate('/certified')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-900/20 active:scale-95"
             >
                🎖️ Get Certified
             </button>
             <button 
                onClick={() => navigate('/submit-report')}
                className="bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
             >
                🚩 Report Malice
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Score & Credits */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl text-white font-black">AV</span>
              </div>
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Confidential Trust Score</h2>
              <MyScoreWidget userAddress={user?.address} />
            </div>
            
            <CreditBalance />
          </div>

          {/* Right: Activity & Actions */}
          <div className="lg:col-span-2 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                   onClick={() => navigate('/identity')}
                   className="bg-gray-900 border border-gray-800 p-6 rounded-3xl hover:border-blue-500/50 cursor-pointer transition-all group"
                >
                   <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📂</div>
                   <h3 className="text-white font-bold mb-1">Identity Vault</h3>
                   <p className="text-gray-500 text-xs">Manage your encrypted documents and PII pinned to IPFS.</p>
                </div>
                
                <div 
                   onClick={() => navigate('/dao')}
                   className="bg-gray-900 border border-gray-800 p-6 rounded-3xl hover:border-purple-500/50 cursor-pointer transition-all group"
                >
                   <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🏛️</div>
                   <h3 className="text-white font-bold mb-1">Governance Participation</h3>
                   <p className="text-gray-500 text-xs">Stake $AV tokens and vote on community security proposals.</p>
                </div>
             </div>

             <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                   <h2 className="text-sm font-black text-white uppercase tracking-widest">Recent Activity Log</h2>
                   <button 
                      onClick={() => navigate('/reports')}
                      className="text-gray-500 hover:text-white text-[10px] font-bold uppercase transition-colors"
                   >
                      View All Logs →
                   </button>
                </div>
                <div className="p-0">
                   {(userData?.transactions || []).length === 0 ? (
                      <div className="p-12 text-center">
                         <div className="text-4xl mb-3 opacity-20">📜</div>
                         <p className="text-gray-600 text-xs font-bold uppercase">No interaction history found</p>
                      </div>
                   ) : (
                      <div className="divide-y divide-gray-800">
                        {userData.transactions.slice(0, 5).map((tx, i) => (
                          <div key={i} className="p-4 flex justify-between items-center hover:bg-white/[0.01] transition-colors">
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${tx.type === "IN" ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"}`}>
                                  {tx.type === 'IN' ? '↓' : '↑'}
                               </div>
                               <div>
                                  <div className="text-white text-xs font-bold">{tx.type === 'IN' ? 'Funds Received' : 'Funds Dispatched'}</div>
                                  <div className="text-[10px] text-gray-500 font-mono">{tx.type === "OUT" ? tx.to.slice(0, 20) : tx.from.slice(0, 20)}...</div>
                               </div>
                            </div>
                            <div className="text-right">
                               <div className="text-white font-black text-xs">{tx.amount} ETH</div>
                               <button 
                                 onClick={() => navigate('/submit-report')}
                                 className="text-[9px] text-gray-600 hover:text-red-400 font-bold uppercase mt-1"
                               >
                                 Flag Issue
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default UserDashboard;

