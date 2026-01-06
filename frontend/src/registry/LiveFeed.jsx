import Badge from "../components/common/Badge";

// Live score update feed
function LiveFeed({ updates }) {
  const getVariant = (change) => {
    if (change > 0) return "success";
    if (change < 0) return "destructive";
    return "default";
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Live Score Updates</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {updates.map((update, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-secondary rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-foreground truncate">{update.address}</p>
              <p className="text-xs text-muted-foreground">{update.timestamp}</p>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <span className="text-sm text-muted-foreground">{update.oldScore.toFixed(2)}</span>
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <Badge variant={getVariant(update.newScore - update.oldScore)}>
                {update.newScore.toFixed(2)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LiveFeed;
