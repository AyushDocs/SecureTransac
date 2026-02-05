import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchVerifications } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { logger } from "../utils/logger";

function VerificationRequestList() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadRequests = async () => {
        if (!user?.address) return;
        setLoading(true);
        try {
            const data = await fetchVerifications({ companyAddress: user.address });
            const pending = data.filter(r => r.status === 'pending');
            setRequests(pending);
        } catch (error) {
            logger.error("Failed to load verification requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, [user?.address]);

    const handleNavigate = () => {
        navigate('/verification-requests');
    };

    if (loading) return <div className="p-6 text-center text-gray-500 animate-pulse text-xs uppercase tracking-widest">Loading Requests...</div>;

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
            <div className="p-4 border-b border-gray-800 bg-gray-800/20 flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Approvals</h3>
                <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-mono border border-blue-500/20">
                    {requests.length} PENDING
                </span>
            </div>
            
            <div className="p-6">
                {requests.length === 0 ? (
                    <div className="text-center text-gray-600 text-sm italic">
                        No pending verification requests.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-gray-950/50 rounded-lg p-4 border border-gray-800/50">
                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-wider">Applicants Queue</div>
                            <div className="space-y-2">
                                {requests.slice(0, 5).map((req) => (
                                    <div key={req.id} className="flex justify-between items-center text-xs">
                                        <span className="text-white font-mono">{req.userName || "Unnamed User"}</span>
                                        <span className="text-gray-500 text-[10px]">{new Date(req.timestamp).toLocaleDateString()}</span>
                                    </div>
                                ))}
                                {requests.length > 5 && (
                                    <div className="text-[10px] text-gray-500 italic pt-1 text-center">
                                        + {requests.length - 5} more applicants
                                    </div>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={handleNavigate}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/20 flex justify-center items-center gap-2 group"
                        >
                            <span>Start Evaluation</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default VerificationRequestList;
