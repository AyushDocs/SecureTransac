import Badge from "../common/Badge";

// Behavioral audit timeline showing transaction history
function AuditTimeline({ events }) {
  const getEventIcon = (type) => {
    switch (type) {
      case "transaction":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case "score_change":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case "flag":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getVariant = (severity) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "warning";
      case "low": return "success";
      default: return "default";
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Audit Timeline</h3>
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                {getEventIcon(event.type)}
              </div>
              {index < events.length - 1 && (
                <div className="w-px h-full bg-border mt-2"></div>
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  {event.type === "transaction" && event.data ? (
                    <div className="mt-2 p-3 bg-secondary/50 rounded-lg border border-border space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="text-foreground font-medium">{event.data.type}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="text-foreground font-medium">{event.data.amount} ETH</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{event.data.to ? "To:" : "From:"}</span>
                        <span className="text-foreground font-mono truncate ml-4">
                          {event.data.to || event.data.from}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                  )}
                </div>
                <Badge variant={getVariant(event.severity)}>{event.severity}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{event.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AuditTimeline;
