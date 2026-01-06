import PageWrapper from "../layout/PageWrapper";
import MetricCard from "../dashboard/MetricCard";
import TrustDonut from "../dashboard/TrustDonut";
import VelocityChart from "../dashboard/VelocityChart";
import RiskHeatmap from "../dashboard/RiskHeatmap";

// Main dashboard page with overview metrics
function Dashboard() {
  const metrics = [
    {
      title: "Blocked Transactions",
      value: 1247,
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
      value: 89432,
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
      value: 12847,
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
      value: 342,
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
    { label: "Low Risk", value: 7234, color: "hsl(142, 76%, 36%)" },
    { label: "Medium Risk", value: 3891, color: "hsl(45, 93%, 47%)" },
    { label: "High Risk", value: 1722, color: "hsl(0, 72%, 51%)" },
  ];

  const velocityData = [
    { label: "Mon", value: 12400 },
    { label: "Tue", value: 14200 },
    { label: "Wed", value: 11800 },
    { label: "Thu", value: 15600 },
    { label: "Fri", value: 13900 },
    { label: "Sat", value: 10200 },
    { label: "Sun", value: 11400 },
  ];

  const heatmapData = Array.from({ length: 4 }, () =>
    Array.from({ length: 7 }, () => Math.random())
  );

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
