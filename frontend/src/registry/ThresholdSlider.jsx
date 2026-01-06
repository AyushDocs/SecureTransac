import { useState } from "react";

// Threshold configuration slider
function ThresholdSlider({ value, onChange, label }) {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
  };

  const handleCommit = () => {
    if (onChange) {
      onChange(localValue);
    }
  };

  const getColor = () => {
    if (localValue >= 0.7) return "bg-green-500";
    if (localValue >= 0.4) return "bg-yellow-400";
    return "bg-red-500";
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{label || "Threshold Configuration"}</h3>
        <span className="text-2xl font-bold text-white">{localValue.toFixed(2)}</span>
      </div>
      <div className="space-y-4">
        <div className="relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localValue}
            onChange={handleChange}
            onMouseUp={handleCommit}
            onTouchEnd={handleCommit}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${localValue * 100}%, #1f2937 ${localValue * 100}%, #1f2937 100%)`
            }}
          />
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>0.0 (Block All)</span>
            <span>0.5</span>
            <span>1.0 (Allow All)</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getColor()}`}></div>
          <span className="text-sm text-gray-400">
            {localValue >= 0.7 ? "Permissive" : localValue >= 0.4 ? "Moderate" : "Strict"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ThresholdSlider;
