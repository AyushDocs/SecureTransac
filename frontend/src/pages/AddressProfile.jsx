import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Web3 from "web3";
import { fetchTrustScore, searchAddress, submitManualOverride } from "../api/client";
import AuditTimeline from "../components/address/AuditTimeline";
import ManualOverride from "../components/address/ManualOverride";
import ScoreGauge from "../components/address/ScoreGauge";
import Badge from "../components/common/Badge";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

// Address profile page showing wallet details
function AddressProfile() {
  const { address } = useParams();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [trustScore, setTrustScore] = useState(null);
  const [loading, setLoading] = useState(true);

  // Access Control State
  const [scoreUnlocked, setScoreUnlocked] = useState(false);
  const [txUnlocked, setTxUnlocked] = useState(false);

  // Determine User Tier (1=Basic, 2=Institutional, 3=Diamond)
  // Default to 1 if not set
  const userTier = user?.issuerRole || 1; 

  const loadData = async () => {
    setLoading(true);
    try {
      logger.info(`AddressProfile: Loading data for ${address}`);
      const [userData, scoreData] = await Promise.all([
        searchAddress(address),
        fetchTrustScore(address),
      ]);
      setProfileData(userData);
      setTrustScore(scoreData.score);
    } catch (error) {
      logger.error(`AddressProfile: Failed to load data for ${address}`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [address]);

  const auditEvents = profileData?.transactions?.map(tx => ({
    type: "transaction",
    title: "Transaction Activity",
    description: `Interaction with ${tx.to || tx.from}`,
    severity: "low",
    timestamp: tx.timestamp ? new Date(tx.timestamp).toLocaleString() : "Recently",
    data: tx,
  })) || [];

  if (profileData?.complaints) {
    profileData.complaints.forEach(complaint => {
      auditEvents.push({
        type: "flag",
        title: "Manual Override / Report",
        description: typeof complaint === 'string' ? complaint : complaint.text,
        severity: complaint.severity >= 4 ? "high" : complaint.severity >= 1 ? "medium" : "low",
        timestamp: complaint.timestamp ? new Date(complaint.timestamp).toLocaleString() : "Recently",
      });
    });
  }

  const handleOverride = async (data) => {
    logger.info("Manual override triggered:", data);
    try {
      await submitManualOverride(data.address, data.action, data.reason);
      await loadData();
    } catch (error) {
      logger.error("Failed to perform manual override:", error);
    }
  };

  // Payment Handlers (Mock logic for now)
  // Payment Handlers
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const processTokenPayment = async (amountAV) => {
    try {
      setPaymentProcessing(true);
      if (!window.ethereum) throw new Error("No crypto wallet found");
      
      const w3 = new Web3(window.ethereum);
      const netId = await w3.eth.net.getId();
      
      const TokenArtifact = await import("../contracts/AVToken.json");
      const RegistryArtifact = await import("../contracts/TrustRegistry.json");

      const tokenData = TokenArtifact.default.networks[netId] || TokenArtifact.default.networks[5777];
      const registryData = RegistryArtifact.default.networks[netId] || RegistryArtifact.default.networks[5777];

      if (!tokenData || !registryData) throw new Error("Contracts not deployed on this network");

      const token = new w3.eth.Contract(TokenArtifact.default.abi, tokenData.address);
      const amountWei = w3.utils.toWei(amountAV.toString(), 'ether'); // Assuming 18 decimals

      // Transfer tokens to TrustRegistry (Treasury)
      await token.methods.transfer(registryData.address, amountWei).send({ from: user.address });
      
      return true;
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed: " + error.message);
      return false;
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleUnlockScore = async () => {
    if (window.confirm("Unlock Trust Score for 50 $AV?")) {
        const success = await processTokenPayment(50);
        if (success) setScoreUnlocked(true);
    }
  };

  const handleUnlockTx = async () => {
    if (window.confirm("Unlock Transaction History for 100 $AV?")) {
        const success = await processTokenPayment(100);
        if (success) setTxUnlocked(true);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64 text-gray-400">
          Loading profile...
        </div>
      </PageWrapper>
    );
  }

  let displayScore = 0.5;
  if (trustScore !== null && trustScore !== 0.5) {
    displayScore = trustScore;
  } else if (profileData?.trustScore !== undefined) {
    displayScore = profileData.trustScore;
  }

  // --- Visibility Logic ---
  // Diamond (3): Free Everything
  // Institutional (2): Pay for Score, Pay for Tx
  // Basic (1): Pay for Score, No Access to Tx

  const isDiamond = userTier >= 3;
  const isInstitutional = userTier === 2;
  const isBasic = userTier === 1;

  const showScore = isDiamond || scoreUnlocked;
  // Transactions: Diamond(Free) OR (Inst + Unlocked)
  // Basic sees nothing regarding transactions (or upgrade prompt)
  const showTx = isDiamond || (isInstitutional && txUnlocked);

  return (
    <PageWrapper>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold text-white">Address Profile</h1>
          <Badge variant={displayScore >= 0.7 ? "success" : displayScore >= 0.4 ? "warning" : "destructive"}>
            {displayScore >= 0.7 ? "Trusted" : displayScore >= 0.4 ? "Moderate" : "Risky"}
          </Badge>
          {profileData?.issuerRole >= 2 && (
            <Badge variant={profileData.issuerRole == 3 ? "premium" : "info"}>
              {profileData.issuerRole == 3 ? "💎 Diamond Authority" : "🏛️ Institutional Authority"}
            </Badge>
          )}
        </div>
        <p className="text-sm font-mono text-gray-400 break-all">{address}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="relative">
              {/* Blur Overlay for Score */}
              {!showScore && (
                  <div className="absolute inset-0 z-10 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border border-gray-800 p-6 text-center">
                      <div className="text-4xl mb-2">🔒</div>
                      <h3 className="text-white font-bold mb-1">Hidden Score</h3>
                      <p className="text-xs text-gray-400 mb-4">
                          {isBasic ? "Basic Plan" : "Institutional Plan"} users must pay to view live scores.
                      </p>
                      <button 
                          onClick={handleUnlockScore}
                          disabled={paymentProcessing}
                          className={`px-4 py-2 text-xs font-bold rounded shadow-lg transition-all ${paymentProcessing ? 'bg-gray-600 text-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'}`}
                      >
                          {paymentProcessing ? "Processing..." : "Unlock (50 $AV)"}
                      </button>
                  </div>
              )}
              <div className={!showScore ? "blur-sm pointer-events-none select-none" : ""}>
                 <ScoreGauge score={displayScore} />
              </div>
          </div>

          <ManualOverride
            address={address}
            currentStatus="neutral"
            onOverride={handleOverride}
          />
        </div>

        <div className="lg:col-span-2">
            <div className="relative h-full">
                {/* Overlay for Transactions */}
                {!showTx && (
                     <div className="absolute inset-0 z-10 bg-gray-900/90 backdrop-blur flex flex-col items-center justify-center rounded-xl border border-gray-800 p-8 text-center">
                        <div className="text-5xl mb-4">📜</div>
                        <h3 className="text-xl text-white font-bold mb-2">Transaction History</h3>
                        
                        {isBasic ? (
                            <>
                                <p className="text-gray-400 text-sm mb-6 max-w-md">
                                    Access to detailed transaction logs is restricted to Institutional and Diamond partners.
                                </p>
                                <button className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-sm font-bold rounded-lg uppercase tracking-wide">
                                    Upgrade Plan
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-400 text-sm mb-6 max-w-md">
                                    Unlock the full transaction audit log for this address. 
                                    <br/><span className="text-xs opacity-70">(Free for Diamond Partners)</span>
                                </p>
                                <button 
                                    onClick={handleUnlockTx}
                                    disabled={paymentProcessing}
                                    className={`px-6 py-2 text-sm font-bold rounded shadow-lg transition-all ${paymentProcessing ? 'bg-gray-600 text-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'}`}
                                >
                                    {paymentProcessing ? "Processing..." : "Unlock History (100 $AV)"}
                                </button>
                            </>
                        )}
                     </div>
                )}

                <div className={!showTx ? "blur-sm pointer-events-none select-none h-full overflow-hidden" : ""}>
                    <AuditTimeline events={auditEvents.length > 0 ? auditEvents : [{
                        type: "info",
                        title: "No Activity",
                        description: "No recent transactions or reports found for this address.",
                        severity: "low",
                        timestamp: "Now",
                    }]} />
                </div>
            </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default AddressProfile;
