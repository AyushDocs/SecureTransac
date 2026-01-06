import { useState, useEffect } from "react";
import Button from "../components/common/Button";

// One-time reveal viewer with time limit
function RevealViewer({ data, expiresIn = 60, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!isRevealed || isExpired) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRevealed, isExpired, onExpire]);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Secure Data Viewer</h3>
        {isRevealed && !isExpired && (
          <div className="flex items-center gap-2 text-warning">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {!isRevealed ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            This data will be visible for {expiresIn} seconds after reveal.
          </p>
          <Button variant="primary" onClick={handleReveal}>
            Reveal Data
          </Button>
        </div>
      ) : isExpired ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            Access has expired. Request a new reveal if needed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-secondary rounded-lg border border-warning/30">
            <p className="text-xs text-warning mb-2">SENSITIVE DATA - DO NOT SHARE</p>
            {data && Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground capitalize">{key}</span>
                <span className="text-sm font-mono text-foreground">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground">
            This view will automatically close in {formatTime(timeLeft)}
          </p>
        </div>
      )}
    </div>
  );
}

export default RevealViewer;
