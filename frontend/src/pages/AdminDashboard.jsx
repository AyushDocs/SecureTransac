import { useEffect, useState } from "react";
import { fetchDashboardMetrics, submitManualOverride } from "../api/client";
import { useSocket } from "../context/SocketContext";
import MetricCard from "../dashboard/MetricCard";
import RiskHeatmap from "../dashboard/RiskHeatmap";
import TrustDonut from "../dashboard/TrustDonut";
import VelocityChart from "../dashboard/VelocityChart";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

function AdminDashboard() {
  const [metricsData, setMetricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchAddr, setSearchAddr] = useState("");
  const [targetScore, setTargetScore] = useState(500);
  const [reason, setReason] = useState("");
  const [overriding, setOverriding] = useState(false);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await fetchDashboardMetrics();
        setMetricsData(data);
      } catch (error) {
        logger.error("AdminDashboard: Failed to load metrics", error);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const handleManualOverride = async (e) => {
    e.preventDefault();
    if (!searchAddr || !reason) return;
    setOverriding(true);
    try {
      const scoreFloat = targetScore / 1000;
      await submitManualOverride(searchAddr, "manual", reason, scoreFloat);
      alert("Manual override successful! User score has been pushed instantly.");
      setSearchAddr("");
      setReason("");
      // Refresh metrics
      const data = await fetchDashboardMetrics();
      setMetricsData(data);
    } catch (error) {
      alert("Failed to apply override");
    } finally {
      setOverriding(false);
    }
  };

  if (loading) return <PageWrapper title="Admin Dashboard"><div className="text-gray-400">Loading...</div></PageWrapper>;

  const metrics = [
    { title: "Blocked Transactions", value: metricsData?.blockedTransactions || 0, change: -12.5, variant: "destructive", icon: "🚫" },
    { title: "Total Evaluations", value: metricsData?.totalEvaluations || 0, change: 24.3, variant: "success", icon: "📊" },
    { title: "Active Wallets", value: metricsData?.activeWallets || 0, change: 8.1, variant: "default", icon: "👛" },
    { title: "Flagged Addresses", value: metricsData?.flaggedAddresses || 0, change: 3.2, variant: "warning", icon: "🚩" },
  ];

  const trustData = [
    { label: "Low Risk", value: metricsData?.riskDistribution?.low || 0, color: "hsl(142, 76%, 36%)" },
    { label: "Medium Risk", value: metricsData?.riskDistribution?.medium || 0, color: "hsl(45, 93%, 47%)" },
    { label: "High Risk", value: metricsData?.riskDistribution?.high || 0, color: "hsl(0, 72%, 51%)" },
  ];

  return (
    <PageWrapper title="SecureTransac: System Administration">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrustDonut data={trustData} />
            <RiskHeatmap data={metricsData?.riskHeatmap || []} />
          </div>
          <VelocityChart data={metricsData?.evaluationVelocity || []} />
          
          {/* Live Feed Component */}
          <LiveFeed />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-purple-500/30 p-6 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.05)]">
            {/* One-Shot Score Push Form - No changes here */}
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-purple-500">⚡</span> One-Shot Score Push
            </h2>
            <p className="text-gray-400 text-sm mb-6">Instantly adjust any user's trust score. This bypasses the normal AI progression logic.</p>
            
            <form onSubmit={handleManualOverride} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">User Address</label>
                <input 
                  type="text"
                  value={searchAddr}
                  onChange={(e) => setSearchAddr(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-xs font-mono focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="0x..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Target Score: {targetScore}</label>
                <input 
                  type="range" min="0" max="1000" step="10"
                  value={targetScore} 
                  onChange={(e) => setTargetScore(e.target.value)}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Justification</label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="Reason for manual adjustment..."
                  rows="3"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={overriding}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {overriding ? "Processing..." : "Push Score Update"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

const LiveFeed = () => {
  const { lastEvent } = useSocket();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (lastEvent) {
      setEvents(prev => [lastEvent, ...prev].slice(0, 10)); // Keep last 10
    }
  }, [lastEvent]);

  return (
    <div className="bg-gray-900 border border-gray-800/50 p-6 rounded-xl">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-green-500 animate-pulse">●</span> Live On-Chain Activity
      </h2>
      <div className="space-y-3">
        {events.length === 0 && <span className="text-gray-500 text-sm">Waiting for blockchain events...</span>}
        {events.map((evt, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-950/50 rounded-lg border border-gray-800/30">
            <span className="text-xl">
              {evt.type === 'tx_event' && '💸'}
              {evt.type === 'report_event' && '🚨'}
              {evt.type === 'verification_event' && '🆔'}
              {evt.type === 'score_event' && '📈'}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-200">
                {evt.type === 'tx_event' && `Transaction: ${evt.data.amount} ETH from ${evt.data.from.substr(0,6)}...`}
                {evt.type === 'report_event' && `Report: ${evt.data.reason} against ${evt.data.target.substr(0,6)}...`}
                {evt.type === 'verification_event' && `Verification ${evt.data.type === 'verification_req' ? 'Requested' : 'Processed'}: ${evt.data.user || evt.data.requestId}`}
                {evt.type === 'score_event' && `Score Update: ${evt.data.user.substr(0,6)}... now has score ${evt.data.newScore}`}
              </p>
              <p className="text-xs text-gray-500">{new Date(evt.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
