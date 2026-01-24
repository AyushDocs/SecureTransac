import { searchAddress, submitComment } from "../api/client";
import CreditBalance from "../components/CreditBalance";
import MyScoreWidget from "../components/MyScoreWidget";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";
import { useState, useEffect } from "react";
function UserDashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTx, setActiveTx] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentRating, setCommentRating] = useState(5);

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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!activeTx || !commentText) return;

    try {
      const target = activeTx.type === "OUT" ? activeTx.to : activeTx.from;
      await submitComment(user.address, target, activeTx.id, commentText, commentRating);
      alert("Feedback submitted! AI is recalculating trust scores...");
      setCommentText("");
      setActiveTx(null);
      const data = await searchAddress(user.address);
      setUserData(data);
    } catch (error) {
      alert("Failed to submit feedback");
    }
  };

  if (loading) return <PageWrapper title="User Dashboard"><div className="text-gray-400">Loading profile...</div></PageWrapper>;

  return (
    <PageWrapper title={`SecureTransac: Profile of ${user?.name || "User"}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Welcome back, {user?.name || "Explorer"}</h1>
        <p className="text-gray-500">Managing your {user?.role} identity on the SecureTransac Network.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Stats */}
        <div className="lg:col-span-1 space-y-6">
          <CreditBalance />

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">My Trust Score</h2>
            <MyScoreWidget userAddress={user?.address} />
          </div>
        </div>

        {/* Right Column - Financial Interactions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-gray-900/50 to-transparent">
              <h2 className="text-xl font-bold text-white tracking-tight">Financial Interactions</h2>
              <p className="text-gray-400 text-xs mt-1">
                History: Origin, Counterparty, Volume, and Reputation Effect.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-800/20 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <tr>
                    <th className="p-4">Origin</th>
                    <th className="p-4">Counterparty</th>
                    <th className="p-4">Volume</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-xs">
                  {(userData?.transactions || []).length === 0 ? (
                    <tr><td colSpan="4" className="p-8 text-center text-gray-600 italic">No history found.</td></tr>
                  ) : (
                    userData.transactions.map((tx, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.type === "IN" ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"}`}>
                            {tx.type === 'IN' ? 'RECEIVED' : 'SENT'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[10px] text-gray-400">
                          {tx.type === "OUT" ? tx.to.slice(0, 16) : tx.from.slice(0, 16)}...
                        </td>
                        <td className="p-4 text-white font-bold">{tx.amount} ETH</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => setActiveTx(tx)}
                            className="text-cyan-500 hover:text-cyan-400 font-bold"
                          >
                            Feedback
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {activeTx && (
            <div className="bg-gray-900 border border-cyan-500/30 p-6 rounded-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">Peer Review</h3>
                <button onClick={() => setActiveTx(null)} className="text-gray-500">✕</button>
              </div>
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <textarea 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-xs"
                  placeholder="Analyze interaction..."
                  rows="2"
                  required
                />
                <button type="submit" className="w-full bg-cyan-600 py-2 rounded-lg text-white font-bold text-xs uppercase">
                  Transmit
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

export default UserDashboard;
