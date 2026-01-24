import { useEffect, useState } from "react";
import { fetchAuthorities, fetchVerifications, pinMetadata, requestVerification, searchAddress, submitComment } from "../api/client";
import FileUpload from "../components/FileUpload";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

/**
 * REBRANDED: GET CERTIFIED Portal
 * Focuses on high-fidelity identity verification and full transaction history.
 */
function ReputationActivity() {
  const { user } = useAuth();
  const { lastEvent } = useSocket();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTx, setActiveTx] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentRating, setCommentRating] = useState(5);
  const [authorities, setAuthorities] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedAuthority, setSelectedAuthority] = useState("");
  const [proof, setProof] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState("");

  const refreshData = async () => {
    if (!user?.address) return;
    try {
      const [data, auths, requests] = await Promise.all([
        searchAddress(user.address),
        fetchAuthorities(),
        fetchVerifications({ userAddress: user.address })
      ]);
      setUserData(data);
      setAuthorities(auths);
      setMyRequests(requests);
    } catch (error) {
      logger.error("ReputationActivity: Failed to refresh", error);
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!user?.address) return;
      setLoading(true);
      await refreshData();
      setLoading(false);
    }
    loadData();
  }, [user?.address]);

  // Real-time Blockchain Sync
  useEffect(() => {
    if (lastEvent) {
      const involvesMe = (
        (lastEvent.type === 'tx_event' && (lastEvent.data.from?.toLowerCase() === user.address.toLowerCase() || lastEvent.data.to?.toLowerCase() === user.address.toLowerCase())) ||
        (lastEvent.type === 'verification_event' && (lastEvent.data.user?.toLowerCase() === user.address.toLowerCase() || lastEvent.data.company?.toLowerCase() === user.address.toLowerCase())) ||
        (lastEvent.type === 'score_event' && lastEvent.data.user?.toLowerCase() === user.address.toLowerCase())
      );

      if (involvesMe) {
        logger.info(`[RealTime] Blockchain event detected for current user: ${lastEvent.type}`);
        refreshData();
      }
    }
  }, [lastEvent, user?.address]);

  const handleRequestVerification = async (e) => {
    e.preventDefault();
    if (!selectedAuthority) return;

    setRequestLoading(true);
    try {
      let proofCid = null;
      if (proof) {
        setRequestStatus("Pinning proof to IPFS...");
        const ipfsResult = await pinMetadata({ proofText: proof });
        proofCid = ipfsResult.cid;
      }

      setRequestStatus("Sending request...");
      await requestVerification(user.address, selectedAuthority, {
        userName: user.name,
        requestDate: new Date().toISOString(),
        proofCid
      });
      alert("Verification request sent successfully!");
      const requests = await fetchVerifications({ userAddress: user.address });
      setMyRequests(requests);
      setSelectedAuthority("");
      setProof("");
    } catch (error) {
      alert("Failed to send verification request");
    } finally {
      setRequestLoading(false);
      setRequestStatus("");
    }
  };

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

  if (loading) return <PageWrapper title="Reputation Portal"><div className="text-gray-400">Syncing with blockchain...</div></PageWrapper>;

  return (
    <PageWrapper title="Certification Portal & System History">
      <div className="space-y-8">
        
        {/* TOP SECTION: IDENTITY VERIFICATION (STRETCHED/FULL WIDTH) */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600"></div>
            <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-6">
                       <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                       Official Network Certification
                   </div>
                   <h2 className="text-4xl font-black text-white leading-tight tracking-tighter mb-4">
                       Get Certified by <br/>Trusted Authorities.
                   </h2>
                   <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                       Elevate your on-chain reputation by obtaining formal attestations. Upload proof of identity or business ownership to unlock the "Diamond" trust tier.
                   </p>
                </div>

                <div className="bg-gray-950/50 border border-gray-800 p-8 rounded-2xl">
                    <form onSubmit={handleRequestVerification} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">Select Auditor</label>
                            <select 
                                value={selectedAuthority}
                                onChange={(e) => setSelectedAuthority(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                            >
                                <option value="">Choose an entity...</option>
                                {authorities.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">Evidence for IPFS Pinning</label>
                            <FileUpload 
                                userAddress={user.address}
                                onUploadSuccess={(cid) => setProof(cid)}
                            />
                        </div>

                        <button 
                            disabled={!selectedAuthority || requestLoading}
                            className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest shadow-xl shadow-cyan-500/10"
                        >
                            {requestLoading ? requestStatus || "TRANSMITTING..." : "Submit for Certification"}
                        </button>
                    </form>
                </div>
            </div>
        </div>

        {/* BOTTOM SECTION: HISTORY & FEEDBACK */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Historical Status */}
            <div className="xl:col-span-1 bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-xl h-fit">
                <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Attestation Status
                </h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {myRequests.length === 0 ? (
                        <div className="text-center py-12 text-gray-600 text-xs italic">
                            No certification requests in progress.
                        </div>
                    ) : (
                        myRequests.map((req, i) => (
                            <div key={i} className="p-4 bg-gray-950 border border-gray-800 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-white">
                                        {authorities.find(a => a.id.toLowerCase() === req.companyAddress.toLowerCase())?.name || "External Auditor"}
                                    </span>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase border ${
                                        req.status === 'approved' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 
                                        req.status === 'rejected' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 
                                        'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                                    }`}>
                                        {req.status}
                                    </span>
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono mb-2">{req.companyAddress.slice(0, 16)}...</div>
                                <div className="text-[10px] text-gray-600">{new Date(req.timestamp).toLocaleDateString()}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Interaction Feed (2/3 width) */}
            <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-gray-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">System Interactions</h2>
                        <p className="text-gray-400 text-xs mt-1 italic">Detailed history of counterparty volume and reputation impact.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center">
                            <div className="text-[10px] text-gray-600 font-bold uppercase">Activity</div>
                            <div className="text-sm font-black text-white">{(userData?.transactions || []).length}</div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800/10 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                            <tr>
                                <th className="p-6">Flow</th>
                                <th className="p-6">Counterparty</th>
                                <th className="p-4 text-right">Volume</th>
                                <th className="p-6 text-right">Reputation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-sm">
                            {(userData?.transactions || []).length === 0 ? (
                                <tr><td colSpan="4" className="p-12 text-center text-gray-600 italic">No historical traces detected.</td></tr>
                            ) : (
                                userData.transactions.map((tx, i) => (
                                    <tr key={i} className="hover:bg-cyan-500/[0.02] transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${tx.type === 'IN' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                                <span className={`text-[10px] font-black uppercase ${tx.type === 'IN' ? 'text-green-500' : 'text-blue-500'}`}>
                                                    {tx.type === 'IN' ? 'CREDIT' : 'DEBIT'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 font-mono text-[11px] text-gray-400 group-hover:text-white transition-colors">
                                            {(() => {
                                                const addr = tx.type === "OUT" ? tx.to : tx.from;
                                                const authMatch = authorities.find(a => a.id.toLowerCase() === addr.toLowerCase());
                                                return authMatch ? authMatch.name : addr;
                                            })()}
                                        </td>
                                        <td className="p-4 text-right text-white font-black">{tx.amount} ETH</td>
                                        <td className="p-6 text-right">
                                            <button 
                                                onClick={() => setActiveTx(tx)}
                                                className="bg-gray-800 group-hover:bg-cyan-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all"
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
        </div>

        {/* Feedback Modal (Detailed NLP Intent) */}
        {activeTx && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-gray-900 border border-cyan-500/40 p-10 rounded-3xl shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-white">Peer Feedback</h2>
                            <p className="text-gray-500 text-sm mt-2 font-mono">Tracing counterparty: {activeTx.type === "OUT" ? activeTx.to.slice(0, 20) : activeTx.from.slice(0, 20)}...</p>
                        </div>
                        <button onClick={() => setActiveTx(null)} className="text-gray-500 hover:text-white text-2xl">✕</button>
                    </div>

                    <form onSubmit={handleCommentSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-gray-300 uppercase tracking-widest">Sentiment Rating</label>
                                <span className="text-2xl font-black text-cyan-400">{commentRating}/5</span>
                            </div>
                            <input 
                                type="range" min="1" max="5" 
                                value={commentRating} 
                                onChange={(e) => setCommentRating(e.target.value)}
                                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                            />
                        </div>
                        
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-300 uppercase tracking-widest">Detailed Context (AI NLP)</label>
                            <textarea 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-6 text-white text-base focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all shadow-inner"
                                placeholder="Describe the transaction intent and counterparty behavior..."
                                rows="4"
                                required
                            />
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-cyan-600/20 text-xs uppercase tracking-[0.2em]"
                        >
                            Transmit Analytical Feedback
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default ReputationActivity;
