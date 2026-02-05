import { useEffect, useState } from "react";
import { fetchAuthorities, requestVerification } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { logger } from "../utils/logger";

function RequestVerificationModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [authorities, setAuthorities] = useState([]);
  const [selectedAuthority, setSelectedAuthority] = useState("");
  const [proofCid, setProofCid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadAuthorities();
    }
  }, [isOpen]);

  const loadAuthorities = async () => {
    try {
      const data = await fetchAuthorities();
      // Filter active authorities
      const active = data.filter((a) => a.status === "active");
      setAuthorities(active);
    } catch (err) {
      logger.error("Failed to load authorities", err);
      setError("Failed to load verification providers.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAuthority) {
      setError("Please select a verification provider.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await requestVerification(user.address, selectedAuthority, {
        proofCid,
        timestamp: Date.now(),
      });
      onClose(); // Close modal on success
      alert("Verification Request Submitted! Please wait for approval.");
    } catch (err) {
      logger.error("Verification Request Failed", err);
      setError(err.message || "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl shadow-blue-900/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Request Verification</h2>
        <p className="text-gray-400 text-sm mb-6">
          Submit your profile to a Trusted Authority for whitelisting.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Select Authority
            </label>
            <select
              value={selectedAuthority}
              onChange={(e) => setSelectedAuthority(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">-- Choose Provider --</option>
              {authorities.map((auth) => (
                <option key={auth.id || auth.address} value={auth.id || auth.address}>
                  {auth.name || "Unknown Authority"} ({auth.level || "Standard"})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 mt-1">
              * Choosing a higher tier authority may process faster.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Proof Document CID (Optional)
            </label>
            <input
              type="text"
              value={proofCid}
              onChange={(e) => setProofCid(e.target.value)}
              placeholder="ipfs://..."
              className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Link to IPFS document proving your identity (e.g. KYC, Employee ID).
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 text-sm font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></span>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestVerificationModal;
