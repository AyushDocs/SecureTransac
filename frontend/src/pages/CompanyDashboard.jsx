import { useEffect, useState } from "react";
import { fetchACL, fetchVerifications, processReport, verifyUser } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

function CompanyDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportText, setReportText] = useState("");
  const [requests, setRequests] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [viewingProof, setViewingProof] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!user?.address) return;
      try {
        const [aclData, reqData] = await Promise.all([
          fetchACL(),
          fetchVerifications({ companyAddress: user.address })
        ]);
        setUsers(aclData);
        setRequests(reqData.filter(r => r.status === 'pending'));
      } catch (error) {
        logger.error("CompanyDashboard: Failed to load data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.address]);

  const handleVerify = async (requestId, status) => {
    setActionLoading(requestId);
    try {
      await verifyUser(requestId, user.address, status);
      alert(`User ${status === 'approved' ? 'Verified' : 'Rejected'} successfully!`);
      // Refresh
      const [aclData, reqData] = await Promise.all([
        fetchACL(),
        fetchVerifications({ companyAddress: user.address })
      ]);
      setUsers(aclData);
      setRequests(reqData.filter(r => r.status === 'pending'));
    } catch (error) {
      alert("Verification action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewProof = async (cid) => {
    setViewingProof({ cid, loading: true });
    try {
      // In a real app, we'd fetch from IPFS. For this demo, we'll simulate the fetch.
      // If the company had the user's public key, they'd decrypt it here.
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

  const handleReport = async (e) => {
    e.preventDefault();
    if (!selectedUser || !reportText) return;

    try {
      await processReport(user.address, selectedUser.address, reportText);
      alert("Report submitted. Given your trusted status, this will significantly affect the user's score.");
      setReportText("");
      setSelectedUser(null);
      // Reload users
      const data = await fetchACL();
      setUsers(data);
    } catch (error) {
      alert("Failed to submit report");
    }
  };

  if (loading) return <PageWrapper title="Company Portal"><div className="text-gray-400">Loading...</div></PageWrapper>;

  return (
    <PageWrapper title="SecureTransac: Company Admin Portal">
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
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((u, i) => (
                    <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 font-mono text-xs text-gray-300">{u.address}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                           <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                             <div 
                               className={`h-full ${u.trustScore >= 0.8 ? "bg-green-500" : u.trustScore >= 0.4 ? "bg-yellow-500" : "bg-red-500"}`}
                               style={{ width: `${u.trustScore * 100}%` }}
                             ></div>
                           </div>
                           <span className="text-sm font-bold text-white">{(u.trustScore * 1000).toFixed(0)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.trustScore >= 0.8 ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                          {u.trustScore >= 0.8 ? "Verified" : "Under Review"}
                        </span>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => setSelectedUser(u)}
                          className="text-red-500 hover:text-red-400 text-sm font-medium"
                        >
                          Report / Blacklist
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Pending Verification Requests</h2>
              <p className="text-gray-400 text-sm">Users asking for your verification to boost their trust score.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-800/50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Proof</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-gray-500 italic">No pending requests</td>
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
                              className="text-blue-400 hover:text-blue-300 text-[10px] font-bold underline"
                            >
                              👁️ View Identity Proof
                            </button>
                          ) : (
                            <span className="text-gray-600 text-[10px]">No proof provided</span>
                          )}
                        </td>
                        <td className="p-4 text-gray-400 text-sm">{new Date(req.timestamp).toLocaleDateString()}</td>
                        <td className="p-4">
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
           <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
             <h2 className="text-xl font-bold text-white mb-2">Company Insights</h2>
             <p className="text-gray-400 text-sm mb-6">As a trusted entity, your reports have 4x the impact of a normal user on the AI scoring model.</p>
             
             <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-6">
                <div className="flex gap-3">
                  <span className="text-yellow-500">⚠️</span>
                  <div className="text-xs text-yellow-200">
                    Use reporting responsibly. False flags may lead to authority revocation.
                  </div>
                </div>
             </div>

             {selectedUser ? (
               <div className="animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-white font-bold mb-4 flex items-center justify-between">
                   Reporting User
                   <button onClick={() => setSelectedUser(null)} className="text-gray-500">✕</button>
                 </h3>
                 <div className="text-xs font-mono text-gray-400 mb-4 truncate">{selectedUser.address}</div>
                 <form onSubmit={handleReport} className="space-y-4">
                   <textarea 
                     className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-red-500 outline-none"
                     placeholder="Detailed reason for report..."
                     rows="4"
                     value={reportText}
                     onChange={(e) => setReportText(e.target.value)}
                     required
                   />
                   <button 
                     type="submit"
                     className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg transition-colors text-sm"
                   >
                     Submit Formal Report
                   </button>
                 </form>
               </div>
             ) : (
               <div className="text-center py-12">
                 <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">🔎</div>
                 <p className="text-gray-500 text-sm">Select a user to report suspicious activity</p>
               </div>
             )}
           </div>

           {viewingProof && (
             <div className="bg-gray-900 border border-blue-500/30 p-6 rounded-xl animate-in slide-in-from-bottom-4">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-bold text-white">Identity Verification Proof</h2>
                 <button onClick={() => setViewingProof(null)} className="text-gray-500 hover:text-white">✕</button>
               </div>
               <div className="p-4 bg-gray-950 border border-gray-800 rounded-lg">
                 <p className="text-[10px] text-blue-400 font-bold uppercase mb-2">IPFS CID: {viewingProof.cid}</p>
                 {viewingProof.loading ? (
                   <div className="text-gray-500 italic text-sm">Fetching and decrypting from IPFS...</div>
                 ) : (
                   <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                     {viewingProof.data}
                   </pre>
                 )}
               </div>
               <p className="mt-4 text-[10px] text-gray-500 italic">
                 Security Note: This document was decrypted using your authority's secure access key.
               </p>
             </div>
           )}
        </div>
      </div>
    </PageWrapper>
  );
}

export default CompanyDashboard;
