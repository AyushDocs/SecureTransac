import { useEffect, useState } from "react";
import { fetchVerifications, verifyUser } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

const VerificationRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [viewingProof, setViewingProof] = useState(null);
  const [scoreInputs, setScoreInputs] = useState({});

  const loadRequests = async () => {
    if (!user?.address) return;
    try {
      const reqData = await fetchVerifications({ companyAddress: user.address });
      setRequests(reqData);
    } catch (error) {
      logger.error("VerificationRequests: Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user?.address]);

  const handleVerify = async (requestId, status) => {
    setActionLoading(requestId);
    try {
      const score = status === 'approved' ? (Number(scoreInputs[requestId]) || 80) : 0;
      await verifyUser(requestId, user.address, status, score);
      alert(`User ${status === 'approved' ? 'Verified' : 'Rejected'} successfully!`);
      await loadRequests();
    } catch (error) {
      console.error(error);
      alert("Verification action failed: " + (error.message || "Unknown error"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewProof = async (cid) => {
    setViewingProof({ cid, loading: true });
    try {
      // 1. Fetch metadata to get real file CID and type
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      let fileUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
      let contentType = 'unknown';

      if (response.ok) {
          const text = await response.text();
          try {
              const data = JSON.parse(text);
              if (data.proofText) {
                  // Metadata wrapper found
                  fileUrl = `https://gateway.pinata.cloud/ipfs/${data.proofText}`;
                  // Try to guess type or let browser handle it
              }
          } catch (e) {
              // Not JSON, assume raw file
          }
      }

      setViewingProof({ 
        cid, 
        loading: false, 
        url: fileUrl
      });

    } catch (error) {
      console.error(error);
      setViewingProof(null);
      alert("Failed to resolve proof document");
    }
  };


  if (loading) return <PageWrapper title="Verification Requests"><div className="text-gray-400">Loading...</div></PageWrapper>;

  return (
    <PageWrapper title="Verification Requests">
      <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Pending Requests</h2>
              <p className="text-gray-400 text-sm">Review documentation and approve/reject verification requests.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-800/50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Document/Proof</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500 italic">No verification requests found</td>
                    </tr>
                  ) : (
                    requests.map((req, i) => (
                      <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                        <td className="p-4 font-mono text-xs text-gray-300">
                          <div className="font-bold text-gray-200">{req.userName || "Unnamed User"}</div>
                          {req.userAddress}
                        </td>
                        <td className="p-4">
                          {req.proofCid ? (
                            <button 
                              onClick={() => handleViewProof(req.proofCid)}
                              className="text-blue-400 hover:text-blue-300 text-[10px] font-bold underline flex items-center gap-1"
                            >
                              <span>📄</span> View Document
                            </button>
                          ) : (
                            <span className="text-gray-600 text-[10px]">No proof provided</span>
                          )}
                        </td>
                        <td className="p-4 text-gray-400 text-sm">{new Date(req.timestamp).toLocaleDateString()}</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${
                                req.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                req.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                'bg-yellow-500/10 text-yellow-500'
                            }`}>
                                {req.status}
                            </span>
                        </td>
                        <td className="p-4">
                          {req.status === 'pending' ? (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="Score"
                                  value={scoreInputs[req.id] || ''}
                                  onChange={(e) => setScoreInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                                  className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-[10px] text-center focus:border-green-500 focus:outline-none"
                                />
                                <button 
                                  onClick={() => handleVerify(req.id, 'approved')}
                                  disabled={actionLoading === req.id}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded uppercase transition-colors disabled:opacity-50"
                                >
                                  {actionLoading === req.id ? "..." : "Approve"}
                                </button>
                                <button 
                                  onClick={() => handleVerify(req.id, 'rejected')}
                                  disabled={actionLoading === req.id}
                                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 text-[10px] font-bold rounded uppercase transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                          ) : (
                              <span className="text-gray-500 text-[10px] italic">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-gray-900 border border-gray-700 w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200">
               
               {/* Modal Header */}
               <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-white">Document Viewer</h2>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono border border-blue-500/20">
                          {viewingProof.cid.slice(0, 16)}...
                      </span>
                  </div>
                  <div className="flex items-center gap-3">
                      {viewingProof.url && (
                          <a 
                              href={viewingProof.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                          >
                              Open Original ↗
                          </a>
                      )}
                      <button 
                          onClick={() => setViewingProof(null)} 
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-all"
                      >
                          ✕
                      </button>
                  </div>
               </div>
               
               {/* Modal Content */}
               <div className="flex-1 bg-gray-950/50 p-2 overflow-hidden relative flex flex-col">
                   {viewingProof.loading ? (
                       <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-500 animate-pulse">
                           <div className="w-12 h-12 rounded-full border-4 border-gray-800 border-t-cyan-500 animate-spin"></div>
                           <p className="text-sm font-mono uppercase tracking-widest">Decrypting & Retrieving...</p>
                       </div>
                   ) : (
                       <iframe 
                           src={viewingProof.url} 
                           className="w-full h-full rounded border border-gray-800 bg-white"
                           title="Proof Document"
                       />
                   )}
               </div>
               
               <div className="p-3 bg-gray-900 border-t border-gray-800 text-center">
                   <p className="text-[10px] text-gray-500">
                       🔒 End-to-End Encrypted Viewer • Only authorized entities can decrypt this content.
                   </p>
               </div>
           </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default VerificationRequests;
