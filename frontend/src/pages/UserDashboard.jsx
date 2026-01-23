import { useEffect, useState } from "react";
import { fetchAuthorities, fetchVerifications, pinMetadata, requestVerification, searchAddress, submitComment } from "../api/client";
import { useAuth } from "../context/AuthContext";
import TrustDonut from "../dashboard/TrustDonut";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

function UserDashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentRating, setCommentRating] = useState(5);
  const [activeTx, setActiveTx] = useState(null);
  const [authorities, setAuthorities] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedAuthority, setSelectedAuthority] = useState("");
  const [proof, setProof] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState("");

  useEffect(() => {
    async function loadData() {
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
        logger.error("UserDashboard: Failed to load data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.address]);

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
      // Refresh requests
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
      // Reload data
      const data = await searchAddress(user.address);
      setUserData(data);
    } catch (error) {
      alert("Failed to submit feedback");
    }
  };

  if (loading) return <PageWrapper title="User Dashboard"><div className="text-gray-400">Loading...</div></PageWrapper>;

  const score = userData?.trustScore || 0.5;
  const riskColor = score >= 0.8 ? "text-green-500" : score >= 0.4 ? "text-yellow-500" : "text-red-500";

  return (
    <PageWrapper title={`SecureTransac: Profile of ${user?.name || "User"}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Welcome back, {user?.name || "Explorer"}</h1>
        <p className="text-gray-500">Managing your {user?.role} identity on the SecureTransac Network.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4">My Trust Score</h2>
            <div className={`text-5xl font-mono font-bold ${riskColor} mb-2`}>
              {(score * 1000).toFixed(0)}
            </div>
            <p className="text-gray-400 text-sm">Base score: 0 - 1000</p>
            <div className="mt-6">
               <TrustDonut data={[
                 { label: "My Score", value: score, color: "hsl(217, 91%, 60%)" },
                 { label: "Remaining", value: 1 - score, color: "hsl(215, 25%, 27%)" }
               ]} />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4">Verification</h2>
            
            {myRequests.length > 0 && (
              <div className="mb-6 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase">My Requests</p>
                {myRequests.map((req, i) => (
                  <div key={i} className="p-3 bg-gray-950 border border-gray-800 rounded-lg flex justify-between items-center">
                    <div className="text-xs">
                      <div className="text-gray-300 font-bold">{authorities.find(a => a.id === req.companyAddress)?.name || "Company"}</div>
                      <div className="text-gray-500 text-[10px]">{new Date(req.timestamp).toLocaleDateString()}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      req.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                      req.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 
                      'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleRequestVerification} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Request Higher Trust</label>
                <select 
                  value={selectedAuthority}
                  onChange={(e) => setSelectedAuthority(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select an Authority...</option>
                  {authorities.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Proof of Identity / Reason</label>
                <textarea 
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-white text-xs outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Paste documentation hash, identity details, or reason for higher trust..."
                  rows="3"
                />
              </div>
              <button 
                disabled={!selectedAuthority || requestLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-bold py-2 rounded-lg transition-all text-sm"
              >
                {requestLoading ? requestStatus || "Sending..." : "Request Verification"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
              <p className="text-gray-400 text-sm">Review your interactions and provide feedback to influence trust scores.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-800/50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="p-4">Type</th>
                    <th className="p-4">Target / Source</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {(userData?.transactions || []).map((tx, i) => (
                    <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === "IN" ? "bg-green-500/20 text-green-500" : "bg-blue-500/20 text-blue-500"}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-300">
                        {tx.type === "OUT" ? tx.to : tx.from}
                      </td>
                      <td className="p-4 text-white font-bold">{tx.amount} ETH</td>
                      <td className="p-4">
                        <button 
                          onClick={() => setActiveTx(tx)}
                          className="text-blue-500 hover:text-blue-400 text-sm font-medium"
                        >
                          Leave Feedback
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {activeTx && (
            <div className="bg-gray-900 border border-blue-500/50 p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Submit Feedback</h2>
                <button onClick={() => setActiveTx(null)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Commenting on your transaction with <span className="text-blue-400 font-mono">
                  {activeTx.type === "OUT" ? activeTx.to : activeTx.from}
                </span>
              </p>
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Rating (1-5)</label>
                  <input 
                    type="range" min="1" max="5" 
                    value={commentRating} 
                    onChange={(e) => setCommentRating(e.target.value)}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Your Comment</label>
                  <textarea 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Describe your experience..."
                    rows="3"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Submit Review
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
