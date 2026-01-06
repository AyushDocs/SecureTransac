// Trust distribution donut chart built with SVG
function TrustDonut({ data }) {
  const trustData = [
    { label: "Low Risk", value: 7234, color: "#22c55e" }, // green-500
    { label: "Medium Risk", value: 3891, color: "#facc15" }, // yellow-400
    { label: "High Risk", value: 1722, color: "#ef4444" }, // red-500
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 80;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  
  const segments = data.map((item, index) => {
    const percentage = item.value / total;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += percentage * circumference;
    
    return (
      <circle
        key={index}
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke={item.color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 100 100)"
        className="transition-all duration-300"
      />
    );
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Trust Distribution</h3>
      <div className="flex items-center gap-6">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#1f2937"
              strokeWidth={strokeWidth}
            />
            {segments}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{total.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Total</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-gray-400">{item.value.toLocaleString()} ({((item.value / total) * 100).toFixed(1)}%)</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TrustDonut;
