import { useEffect, useState } from "react";
import { fetchDashboardMetrics } from "../api/client";
import MetricCard from "../dashboard/MetricCard";
import RiskHeatmap from "../dashboard/RiskHeatmap";
import TrustDonut from "../dashboard/TrustDonut";
import VelocityChart from "../dashboard/VelocityChart";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";
import { useAuth } from "../context/AuthContext";
import RequestVerificationModal from "../components/RequestVerificationModal";

// Main dashboard page with overview metrics
function Dashboard() {
  const { user, role } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    async function loadMetrics() {
      try {
        logger.info("Dashboard: Loading metrics...");
        const data = await fetchDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        logger.error("Dashboard: Failed to load metrics", error);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const metricsData = metrics; // Keep metricsData for existing references, but use 'metrics' for new state

  const metricCards = [
    {
      title: "Blocked Transactions",
      value: metricsData?.blockedTransactions || 0,
      change: -12.5,
      variant: "destructive",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
    {
      title: "Total Evaluations",
      value: metricsData?.totalEvaluations || 0,
      change: 24.3,
      variant: "success",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: "Active Wallets",
      value: metricsData?.activeWallets || 0,
      change: 8.1,
      variant: "default",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: "Flagged Addresses",
      value: metricsData?.flaggedAddresses || 0,
      change: 3.2,
      variant: "warning",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
    },
  ];

  const trustData = [
    { label: "Low Risk", value: metricsData?.riskDistribution?.low || 0, color: "hsl(142, 76%, 36%)" },
    { label: "Medium Risk", value: metricsData?.riskDistribution?.medium || 0, color: "hsl(45, 93%, 47%)" },
    { label: "High Risk", value: metricsData?.riskDistribution?.high || 0, color: "hsl(0, 72%, 51%)" },
  ];

  const velocityData = metricsData?.evaluationVelocity || [
    { label: "Mon", value: 0 },
    { label: "Tue", value: 0 },
    { label: "Wed", value: 0 },
    { label: "Thu", value: 0 },
    { label: "Fri", value: 0 },
    { label: "Sat", value: 0 },
    { label: "Sun", value: 0 },
  ];

  const heatmapData = metricsData?.riskHeatmap || Array.from({ length: 4 }, () =>
    Array.from({ length: 7 }, () => 0)
  );

  if (loading) {
    return (
      <PageWrapper title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading metrics...</div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Dashboard">
      <div className="space-y-6">
        
        {/* Verification Call to Action */}
        {user?.trustScore < 0.8 && role !== 'admin' && (
           <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-xl p-6 flex justify-between items-center relative overflow-hidden group shadow-lg shadow-blue-900/10">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>
              <div className="relative z-10">
                 <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <span>🛡️</span> Get Verified & Boost Your Score
                 </h3>
                 <p className="text-gray-400 text-sm max-w-xl">
                    Request verification from a Trusted Company to instantly upgrade your Trust Score to <span className="text-green-400 font-bold">900+ (Low Risk)</span>.
                 </p>
              </div>
              <button 
                onClick={() => setShowVerificationModal(true)}
                className="relative z-10 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-900/30 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                 Request Verification
              </button>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <TrustDonut data={trustData} />
        <RiskHeatmap data={heatmapData} />
      </div>

      <div className="mt-6">
        <VelocityChart data={velocityData} />
      </div>

      <RequestVerificationModal 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)} 
      />
    </PageWrapper>
  );
}

export default Dashboard;
