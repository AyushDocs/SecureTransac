import { useState } from "react";
import PageWrapper from "../layout/PageWrapper";
import ACLTable from "../registry/ACLTable";
import ThresholdSlider from "../registry/ThresholdSlider";
import LiveFeed from "../registry/LiveFeed";

// Registry management page
function Registry() {
  const [threshold, setThreshold] = useState(0.65);

  const aclEntries = [
    {
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2e322",
      type: "whitelist",
      addedBy: "admin@securetransac.io",
      date: "2024-01-15",
    },
    {
      address: "0x8Ba1f109551bD432803012645Ac136ddd64DBA72",
      type: "blacklist",
      addedBy: "security@securetransac.io",
      date: "2024-01-14",
    },
    {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      type: "whitelist",
      addedBy: "admin@securetransac.io",
      date: "2024-01-12",
    },
    {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      type: "blacklist",
      addedBy: "compliance@securetransac.io",
      date: "2024-01-10",
    },
  ];

  const liveUpdates = [
    {
      address: "0x1234...5678",
      oldScore: 0.45,
      newScore: 0.52,
      timestamp: "Just now",
    },
    {
      address: "0xabcd...ef01",
      oldScore: 0.78,
      newScore: 0.72,
      timestamp: "2 min ago",
    },
    {
      address: "0x9876...5432",
      oldScore: 0.31,
      newScore: 0.35,
      timestamp: "5 min ago",
    },
    {
      address: "0xfedc...ba98",
      oldScore: 0.89,
      newScore: 0.91,
      timestamp: "8 min ago",
    },
    {
      address: "0x2468...1357",
      oldScore: 0.56,
      newScore: 0.48,
      timestamp: "12 min ago",
    },
  ];

  const handleRemove = (address) => {
    console.log("Remove address:", address);
  };

  const handleThresholdChange = (value) => {
    setThreshold(value);
    console.log("Threshold updated:", value);
  };

  return (
    <PageWrapper title="Registry Management">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ACLTable entries={aclEntries} onRemove={handleRemove} />
        </div>
        <div className="space-y-6">
          <ThresholdSlider
            value={threshold}
            onChange={handleThresholdChange}
            label="Trust Threshold"
          />
          <LiveFeed updates={liveUpdates} />
        </div>
      </div>
    </PageWrapper>
  );
}

export default Registry;
