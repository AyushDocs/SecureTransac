// Real-time trust score gauge visualization
function ScoreGauge({ score, size = 200 }) {
  const percentage = score * 100;
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (score * circumference);
  
  const getColor = () => {
    if (score >= 0.7) return "hsl(var(--success))";
    if (score >= 0.4) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };
  
  const getLabel = () => {
    if (score >= 0.7) return "Low Risk";
    if (score >= 0.4) return "Medium Risk";
    return "High Risk";
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Trust Score</h3>
      <div className="flex flex-col items-center">
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
          {/* Background arc */}
          <path
            d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
            fill="none"
            stroke={getColor()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="text-center -mt-8">
          <p className="text-4xl font-bold text-foreground">{score.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground mt-1">{getLabel()}</p>
        </div>
        <div className="flex justify-between w-full mt-4 text-xs text-muted-foreground">
          <span>0.0</span>
          <span>0.5</span>
          <span>1.0</span>
        </div>
      </div>
    </div>
  );
}

export default ScoreGauge;
