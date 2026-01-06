import { useEffect, useState } from "react";
import { fetchDashboardMetrics } from "../api/client";
import MetricCard from "../dashboard/MetricCard";
import RiskHeatmap from "../dashboard/RiskHeatmap";
import TrustDonut from "../dashboard/TrustDonut";
import VelocityChart from "../dashboard/VelocityChart";
import PageWrapper from "../layout/PageWrapper";
import { logger } from "../utils/logger";

// Main dashboard page with overview metrics
function Dashboard() {
  const [metricsData, setMetricsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        logger.info("Dashboard: Loading metrics...");
        const data = await fetchDashboardMetrics();
        setMetricsData(data);
      } catch (error) {
        logger.error("Dashboard: Failed to load metrics", error);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const metrics = [
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <TrustDonut data={trustData} />
        <RiskHeatmap data={heatmapData} />
      </div>

      <div className="mt-6">
        <VelocityChart data={velocityData} />
      </div>
    </PageWrapper>
  );
}

export default Dashboard;
