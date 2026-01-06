import { useParams } from "react-router-dom";
import PageWrapper from "../layout/PageWrapper";
import ScoreGauge from "../components/address/ScoreGauge";
import AuditTimeline from "../components/address/AuditTimeline";
import ManualOverride from "../components/address/ManualOverride";
import Badge from "../components/common/Badge";

// Address profile page showing wallet details
function AddressProfile() {
  const { address } = useParams();

  // Mock data
  const score = 0.73;
  const auditEvents = [
    {
      type: "transaction",
      title: "Outgoing Transfer",
      description: "Transferred 2.5 ETH to verified exchange",
      severity: "low",
      timestamp: "2 hours ago",
    },
    {
      type: "score_change",
      title: "Score Updated",
      description: "Trust score increased from 0.68 to 0.73",
      severity: "low",
      timestamp: "5 hours ago",
    },
    {
      type: "transaction",
      title: "Incoming Transfer",
      description: "Received 1.2 ETH from unknown address",
      severity: "medium",
      timestamp: "1 day ago",
    },
    {
      type: "flag",
      title: "Interaction Flagged",
      description: "Interacted with address on watchlist",
      severity: "high",
      timestamp: "3 days ago",
    },
    {
      type: "transaction",
      title: "Smart Contract Interaction",
      description: "Called verified DeFi protocol",
      severity: "low",
      timestamp: "5 days ago",
    },
  ];

  const handleOverride = (data) => {
    console.log("Override action:", data);
  };

  return (
    <PageWrapper>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold text-white">Address Profile</h1>
          <Badge variant={score >= 0.7 ? "success" : score >= 0.4 ? "warning" : "destructive"}>
            {score >= 0.7 ? "Trusted" : score >= 0.4 ? "Moderate" : "Risky"}
          </Badge>
        </div>
        <p className="text-sm font-mono text-gray-400 break-all">{address}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ScoreGauge score={score} />
          <ManualOverride
            address={address}
            currentStatus="neutral"
            onOverride={handleOverride}
          />
        </div>
        <div className="lg:col-span-2">
          <AuditTimeline events={auditEvents} />
        </div>
      </div>
    </PageWrapper>
  );
}

export default AddressProfile;
