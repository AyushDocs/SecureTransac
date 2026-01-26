import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTrustScore, searchAddress, submitManualOverride } from "../api/client";
import AuditTimeline from "../components/address/AuditTimeline";
import ManualOverride from "../components/address/ManualOverride";
import ScoreGauge from "../components/address/ScoreGauge";
import Badge from "../components/common/Badge";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

// Address profile page showing wallet details
function AddressProfile() {
  const { address } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [trustScore, setTrustScore] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      logger.info(`AddressProfile: Loading data for ${address}`);
      const [user, scoreData] = await Promise.all([
        searchAddress(address),
        fetchTrustScore(address),
      ]);
      setProfileData(user);
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
      // Refresh data after successful override
      await loadData();
    } catch (error) {
      logger.error("Failed to perform manual override:", error);
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

  // Fallback logic: 
  // 1. If we have a contract score and it's NOT the default 0.5, use it.
  // 2. Otherwise, if the backend has a score, use that.
  // 3. Finally, default to 0.5.
  let displayScore = 0.5;
  if (trustScore !== null && trustScore !== 0.5) {
    displayScore = trustScore;
  } else if (profileData?.trustScore !== undefined) {
    displayScore = profileData.trustScore;
  }

  return (
    <PageWrapper>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold text-white">Address Profile</h1>
          <Badge variant={displayScore >= 0.7 ? "success" : displayScore >= 0.4 ? "warning" : "destructive"}>
            {displayScore >= 0.7 ? "Trusted" : displayScore >= 0.4 ? "Moderate" : "Risky"}
          </Badge>
          {profileData?.reporterTier >= 2 && (
            <Badge variant={profileData.reporterTier == 3 ? "premium" : "info"}>
              {profileData.reporterTier == 3 ? "💎 Diamond Authority" : "🏛️ Institutional Authority"}
            </Badge>
          )}
        </div>
        <p className="text-sm font-mono text-gray-400 break-all">{address}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ScoreGauge score={displayScore} />
          <ManualOverride
            address={address}
            currentStatus="neutral"
            onOverride={handleOverride}
          />
        </div>
        <div className="lg:col-span-2">
          <AuditTimeline events={auditEvents.length > 0 ? auditEvents : [{
            type: "info",
            title: "No Activity",
            description: "No recent transactions or reports found for this address.",
            severity: "low",
            timestamp: "Now",
          }]} />
        </div>
      </div>
    </PageWrapper>
  );
}

export default AddressProfile;
