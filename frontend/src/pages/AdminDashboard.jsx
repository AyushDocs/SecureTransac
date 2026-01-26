import { useEffect, useState } from "react";
import { fetchACL, fetchDashboardMetrics } from "../api/client";
import { useSocket } from "../context/SocketContext";
import MetricCard from "../dashboard/MetricCard";
import RiskHeatmap from "../dashboard/RiskHeatmap";
import TrustDonut from "../dashboard/TrustDonut";
import VelocityChart from "../dashboard/VelocityChart";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

function AdminDashboard() {
  const [metricsData, setMetricsData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function loadData() {
      try {
        const [data, aclData] = await Promise.all([
          fetchDashboardMetrics(),
          fetchACL()
        ]);
        setMetricsData(data);
        setUsers(aclData);
      } catch (error) {
        logger.error("AdminDashboard: Failed to load data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);



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

      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrustDonut data={trustData} />
          <RiskHeatmap data={metricsData?.riskHeatmap || []} />
        </div>
        <VelocityChart data={metricsData?.evaluationVelocity || []} />
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mt-6">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Global User Directory</h2>
              <p className="text-gray-500 text-xs">Live blockchain-decrypted trust records</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800/50 text-gray-500 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-4">Identity Hash</th>
                  <th className="p-4 text-center">Live Score</th>
                  <th className="p-4">Risk Profile</th>
                  <th className="p-4">System Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((u, i) => (
                  <tr key={i} className="hover:bg-gray-800/20 transition-colors">
                    <td className="p-4 font-mono text-[11px] text-blue-400">
                      {u.address}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center">
                         <span className={`text-lg font-black ${u.trustScore >= 0.8 ? "text-green-400" : u.trustScore >= 0.4 ? "text-yellow-400" : "text-red-400"}`}>
                           {(u.trustScore || 0).toFixed(2)}
                         </span>
                         <div className="w-24 h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full ${u.trustScore >= 0.8 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : u.trustScore >= 0.4 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${(u.trustScore || 0) * 100}%` }}
                            ></div>
                         </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.trustScore >= 0.8 ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"}`}>
                        {u.trustScore >= 0.8 ? "Verified Elite" : "Standard Review"}
                      </span>
                    </td>
                    <td className="p-4">
                       <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          SYNCED
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Feed Component */}
        <LiveFeed />
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
