// Risk heatmap grid visualization
function RiskHeatmap({ data }) {
  const getColor = (value) => {
    if (value < 2) return "bg-green-500";
    if (value < 4) return "bg-yellow-400";
    return "bg-red-500";
  };
  
  const getOpacity = (value) => {
    return 0.3 + (value / 5) * 0.7; // Normalize to 0-5 scale
  };

  // Convert flat array to grid format (4 rows x 6 cols = 24 hours)
  const createGrid = () => {
    const grid = [];
    const hours = 24;
    const cols = 6;
    const rows = 4;
    
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const hour = r * cols + c;
        const dataPoint = data?.find(d => d.hour === hour);
        row.push(dataPoint?.risk || Math.random() * 3); // Random fallback
      }
      grid.push(row);
    }
    return grid;
  };

  const grid = createGrid();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Risk Heatmap</h3>
      <div className="grid grid-cols-6 gap-1">
        {grid.map((row, rowIndex) => (
          row.map((value, colIndex) => {
            const hour = rowIndex * 6 + colIndex;
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`aspect-square rounded ${getColor(value)} transition-all hover:scale-110 cursor-pointer`}
                style={{ opacity: getOpacity(value) }}
                title={`Hour ${hour}:00 - Risk: ${value.toFixed(1)}/5`}
              />
            );
          })
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
