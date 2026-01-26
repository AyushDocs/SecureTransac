// Evaluation velocity line chart built with SVG
function VelocityChart({ data }) {
  // Handle empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Evaluation Velocity</h3>
        <p className="text-gray-500 text-sm">No velocity data available</p>
      </div>
    );
  }

  // Map backend format {date, count} to {label, value}
  const chartData = data.map(d => ({
    label: d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
    value: d.count || 0
  }));

  const maxValue = Math.max(...chartData.map(d => d.value), 1); // Ensure at least 1
  const minValue = Math.min(...chartData.map(d => d.value), 0);
  const range = maxValue - minValue || 1; // Prevent division by zero
  
  const width = 500;
  const height = 200;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const points = chartData.map((d, i) => {
    const x = padding + (i / Math.max(chartData.length - 1, 1)) * chartWidth;
    const y = padding + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y, ...d };
  });
  
  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, "");
  
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Evaluation Velocity</h3>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <g key={i}>
            <line
              x1={padding}
              y1={padding + chartHeight * (1 - ratio)}
              x2={width - padding}
              y2={padding + chartHeight * (1 - ratio)}
              stroke="#1f2937"
              strokeDasharray="4 4"
            />
            <text
              x={padding - 8}
              y={padding + chartHeight * (1 - ratio) + 4}
              textAnchor="end"
              className="fill-gray-400 text-xs"
            >
              {Math.round(minValue + range * ratio)}
            </text>
          </g>
        ))}
        
        {/* Area fill */}
        <path
          d={areaD}
          fill="#22c55e"
          fillOpacity="0.1"
        />
        
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#22c55e"
              className="cursor-pointer hover:fill-white transition-colors"
            />
            <text
              x={point.x}
              y={height - 10}
              textAnchor="middle"
              className="fill-gray-400 text-xs"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default VelocityChart;
