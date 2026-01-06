// Dashboard metric card displaying key statistics
function MetricCard({ title, value, change, icon, variant = "default" }) {
  const iconColors = {
    default: "text-gray-200",
    success: "text-green-500",
    warning: "text-yellow-400",
    destructive: "text-red-500",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-white mt-1">{value.toLocaleString()}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change >= 0 ? "text-green-500" : "text-red-500"}`}>
              {change >= 0 ? "+" : ""}{change}% from last period
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-gray-800 ${iconColors[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default MetricCard;
