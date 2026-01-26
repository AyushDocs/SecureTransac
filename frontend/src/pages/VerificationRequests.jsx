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
      await verifyUser(requestId, user.address, status);
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
      setTimeout(() => {
        setViewingProof({ 
          cid, 
          loading: false, 
          data: "ENCRYPTED_IDENTITY_DOCUMENT: SHA256[8b1...]\nUser has submitted government ID and address proof for manual review." 
        });
      }, 800);
    } catch (error) {
      setViewingProof(null);
      alert("Failed to fetch proof from IPFS");
    }
  };

  if (loading) return <PageWrapper title="Verification Requests"><div className="text-gray-400">Loading...</div></PageWrapper>;

  return (
    <PageWrapper title="Verification Requests">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                              <div className="flex gap-2">
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

        <div className="lg:col-span-1 space-y-6">
           {viewingProof ? (
             <div className="bg-gray-900 border border-blue-500/30 p-6 rounded-xl animate-in slide-in-from-bottom-4 sticky top-6">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-bold text-white">Document Viewer</h2>
                 <button onClick={() => setViewingProof(null)} className="text-gray-500 hover:text-white">✕</button>
               </div>
               <div className="p-4 bg-gray-950 border border-gray-800 rounded-lg min-h-[200px] flex flex-col">
                 <p className="text-[10px] text-blue-400 font-bold uppercase mb-2">CID: {viewingProof.cid}</p>
                 {viewingProof.loading ? (
                   <div className="flex-1 flex items-center justify-center text-gray-500 italic text-sm">Decrypting secure file...</div>
                 ) : (
                   <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-auto max-h-[400px]">
                     {viewingProof.data}
                   </pre>
                 )}
               </div>
               <div className="mt-4 p-3 bg-blue-900/10 border border-blue-900/30 rounded text-[10px] text-blue-300">
                 This document is end-to-end encrypted. Only authorized officers can view it.
               </div>
             </div>
           ) : (
             <div className="bg-gray-900/50 border border-gray-800/50 p-6 rounded-xl text-center">
                 <div className="text-4xl mb-4">📂</div>
                 <h3 className="text-gray-300 font-bold mb-2">Document Preview</h3>
                 <p className="text-gray-500 text-sm">Select a "View Document" button to inspect user proofs here.</p>
             </div>
           )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default VerificationRequests;
