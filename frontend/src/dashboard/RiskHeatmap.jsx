// Risk heatmap grid visualization
function RiskHeatmap({ data }) {
  const getColor = (value) => {
    if (value < 0.3) return "bg-green-500";
    if (value < 0.6) return "bg-yellow-400";
    return "bg-red-500";
  };
  
  const getOpacity = (value) => {
    return 0.3 + value * 0.7;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Risk Heatmap</h3>
      <div className="grid grid-cols-7 gap-1">
        {data.map((row, rowIndex) => (
          row.map((value, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`aspect-square rounded ${getColor(value)} transition-all hover:scale-110 cursor-pointer`}
              style={{ opacity: getOpacity(value) }}
              title={`Risk: ${(value * 100).toFixed(0)}%`}
            />
          ))
        ))}
      </div>
      <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500 opacity-70"></div>
          <span>Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-400 opacity-70"></div>
          <span>Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500 opacity-70"></div>
          <span>High Risk</span>
        </div>
      </div>
    </div>
  );
}

export default RiskHeatmap;
