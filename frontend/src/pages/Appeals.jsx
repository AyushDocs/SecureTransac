import { useEffect, useState } from "react";
import { fetchAppeals, fetchTrustScore, processAppeal, submitAppeal } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

function Appeals() {
  const { user } = useAuth();
  const { lastEvent } = useSocket();
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [currentScore, setCurrentScore] = useState(null);
  const [adminAction, setAdminAction] = useState(null); // { appealId, comment, targetScore }
  
  const isAdmin = user?.role === 'admin' || user?.role === 'deployer';

  const loadData = async () => {
    try {
      const [appealsData, scoreData] = await Promise.all([
        fetchAppeals(),
        !isAdmin ? fetchTrustScore(user.address) : Promise.resolve(null)
      ]);
      setAppeals(appealsData);
      if (scoreData) setCurrentScore(scoreData.score);
    } catch (error) {
      logger.error("Appeals: Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.address, isAdmin]);

  useEffect(() => {
    if (lastEvent && lastEvent.type === 'appeal_event') {
        loadData();
    }
  }, [lastEvent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    try {
      await submitAppeal(reason, currentScore);
      alert("Appeal submitted successfully. An administrator will review your case.");
      setReason("");
      loadData();
    } catch (error) {
      alert("Failed to submit appeal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcess = async (status) => {
    if (!adminAction) return;
    try {
      await processAppeal(
        adminAction.appealId, 
        status, 
        adminAction.comment, 
        status === 'approved' ? parseFloat(adminAction.targetScore) : undefined
      );
      alert(`Appeal ${status === 'approved' ? 'approved' : 'rejected'}`);
      setAdminAction(null);
      loadData();
    } catch (error) {
      alert("Failed to process appeal");
    }
  };

  if (loading) return <PageWrapper title="Conflict Resolution"><div className="text-gray-400 text-center py-12">Syncing resolution protocols...</div></PageWrapper>;

  return (
    <PageWrapper title="Conflict Resolution: Dispute & Appeals">
      <div className="space-y-8">
        {!isAdmin && (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 md:p-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest mb-6">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                Dispute Governance
              </div>
              <h2 className="text-4xl font-black text-white leading-tight tracking-tighter mb-4">
                Wrongful Score <br/>Decrease?
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mb-8">
                If your trust score has been impacted by false reports or AI anomalies, you can file a formal appeal. 
                Provide context and evidence to have our auditors manually review your transaction history.
              </p>

              <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Dispute Justification</label>
                    <textarea 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-6 text-white text-base focus:ring-4 focus:ring-red-500/10 focus:border-red-500/50 outline-none transition-all"
                        placeholder="Describe why the decrease was wrongful..."
                        rows="4"
                        required
                    />
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="px-6 py-3 bg-gray-950 border border-gray-800 rounded-xl">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Affected Score</div>
                        <div className="text-xl font-black text-white">{(currentScore * 1000).toFixed(0)}</div>
                    </div>
                    <button 
                        disabled={submitting}
                        className="flex-1 bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest"
                    >
                        {submitting ? "TRANSMITTING DISPUTE..." : "Submit Appeal Request"}
                    </button>
                 </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                <div>
                     <h3 className="text-xl font-bold text-white uppercase tracking-tight">Dispute Registry</h3>
                     <p className="text-gray-400 text-xs mt-1">Audit log of all active and historical score appeals.</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-800/10 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                        <tr>
                            <th className="p-6">ID</th>
                            {isAdmin && <th className="p-6">User</th>}
                            <th className="p-6">Reason</th>
                            <th className="p-6">Status</th>
                            <th className="p-6">Submitted</th>
                            <th className="p-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {appeals.length === 0 ? (
                            <tr><td colSpan={isAdmin ? 6 : 5} className="p-12 text-center text-gray-600 italic">No disputes found in the registry.</td></tr>
                        ) : (
                            appeals.map((apl, i) => (
                                <tr key={i} className="hover:bg-cyan-500/[0.01] transition-colors group">
                                    <td className="p-6 font-mono text-[10px] text-gray-500">#{apl.id.slice(-6)}</td>
                                    {isAdmin && <td className="p-6 font-mono text-[11px] text-white">{apl.userAddress.slice(0, 16)}...</td>}
                                    <td className="p-6 text-sm text-gray-300 max-w-xs truncate">{apl.reason}</td>
                                    <td className="p-6">
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase border ${
                                            apl.status === 'approved' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 
                                            apl.status === 'rejected' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 
                                            'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                                        }`}>
                                            {apl.status}
                                        </span>
                                    </td>
                                    <td className="p-6 text-[10px] text-gray-500">{new Date(apl.timestamp).toLocaleDateString()}</td>
                                    <td className="p-6 text-right">
                                        {isAdmin && apl.status === 'pending' ? (
                                            <button 
                                                onClick={() => setAdminAction({ appealId: apl.id, targetScore: (apl.currentScore * 1).toFixed(2) })}
                                                className="bg-white text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-gray-200 transition-all"
                                            >
                                                Review
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-gray-600">View Logs</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Admin Review Modal */}
        {adminAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-gray-900 border border-cyan-500/40 p-10 rounded-3xl shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-white">Dispute Review</h2>
                            <p className="text-gray-500 text-sm mt-2 font-mono">Governing CID: {adminAction.appealId}</p>
                        </div>
                        <button onClick={() => setAdminAction(null)} className="text-gray-500 hover:text-white text-2xl">✕</button>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-300 uppercase tracking-widest">Internal Review Note</label>
                            <textarea 
                                value={adminAction.comment || ""}
                                onChange={(e) => setAdminAction({ ...adminAction, comment: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-6 text-white text-base focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all shadow-inner"
                                placeholder="Add justification for the decision..."
                                rows="3"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-300 uppercase tracking-widest">Correction Score: {(parseFloat(adminAction.targetScore) * 1000).toFixed(0)}</label>
                            <input 
                                type="range" min="0" max="1" step="0.01"
                                value={adminAction.targetScore} 
                                onChange={(e) => setAdminAction({ ...adminAction, targetScore: e.target.value })}
                                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                            <p className="text-[10px] text-gray-500 italic">This will manually push a new score to the blockchain TrustRegistry.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <button 
                                onClick={() => handleProcess('rejected')}
                                className="bg-gray-800 text-white font-black py-4 rounded-xl hover:bg-gray-700 transition-all text-xs uppercase"
                            >
                                Reject Appeal
                            </button>
                            <button 
                                onClick={() => handleProcess('approved')}
                                className="bg-green-600 text-white font-black py-4 rounded-xl hover:bg-green-500 transition-all text-xs uppercase shadow-xl shadow-green-600/20"
                            >
                                Approve & Push Score
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default Appeals;
