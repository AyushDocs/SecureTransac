const RANK_CONFIG = {
    DIAMOND: { gradient: 'from-cyan-300 to-blue-500', emoji: '💎', min: 90, label: 'DIAMOND' },
    PLATINUM: { gradient: 'from-gray-300 to-gray-500', emoji: '🔷', min: 80, label: 'PLATINUM' },
    GOLD: { gradient: 'from-yellow-400 to-orange-500', emoji: '🥇', min: 60, label: 'GOLD' },
    SILVER: { gradient: 'from-gray-200 to-gray-400', emoji: '🥈', min: 40, label: 'SILVER' },
    BRONZE: { gradient: 'from-orange-500 to-amber-800', emoji: '🥉', min: 0, label: 'BRONZE' },
};

function getRank(scorePercent) {
    if (scorePercent >= 90) return RANK_CONFIG.DIAMOND;
    if (scorePercent >= 80) return RANK_CONFIG.PLATINUM;
    if (scorePercent >= 60) return RANK_CONFIG.GOLD;
    if (scorePercent >= 40) return RANK_CONFIG.SILVER;
    return RANK_CONFIG.BRONZE;
}

function generateCardHTML({ address, score, name, timestamp, chainId, networkName }) {
    const scorePercent = Math.round(score * 100);
    const rank = getRank(scorePercent);
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const displayName = name || `User ${shortAddr}`;
    const date = timestamp ? new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const netName = networkName || 'Ethereum';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SecureTransac Reputation Card - ${rank.label}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #0a0a0f;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    color: white;
  }
  .card {
    width: 480px;
    border-radius: 24px;
    overflow: hidden;
    background: linear-gradient(135deg, ${rank.gradient.includes('cyan') ? '#0e7490, #1d4ed8' : rank.gradient.includes('gray-3') ? '#9ca3af, #6b7280' : rank.gradient.includes('yellow') ? '#facc15, #f97316' : rank.gradient.includes('gray-2') ? '#d1d5db, #9ca3af' : '#f97316, #92400e'});
    box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 40px ${rank.gradient.includes('cyan') ? 'rgba(6,182,212,0.3)' : rank.gradient.includes('yellow') ? 'rgba(250,204,21,0.3)' : 'rgba(249,115,22,0.2)'};
    position: relative;
  }
  .card::before {
    content: '';
    position: absolute;
    top: -40%;
    right: -20%;
    width: 300px;
    height: 300px;
    background: rgba(255,255,255,0.08);
    border-radius: 50%;
    filter: blur(60px);
  }
  .card::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -15%;
    width: 250px;
    height: 250px;
    background: rgba(255,255,255,0.05);
    border-radius: 50%;
    filter: blur(50px);
  }
  .card-inner {
    padding: 36px;
    position: relative;
    z-index: 1;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;
  }
  .network-badge {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.6);
  }
  .shield {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  .rank-section {
    margin-bottom: 28px;
  }
  .rank-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: rgba(0,0,0,0.4);
    margin-bottom: 6px;
  }
  .rank-name {
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -1px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  .score-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 28px;
  }
  .score-value {
    font-size: 48px;
    font-weight: 900;
    color: rgba(255,255,255,0.9);
    line-height: 1;
  }
  .score-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: rgba(0,0,0,0.35);
  }
  .identity {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .user-info {}
  .user-name {
    font-size: 14px;
    font-weight: 800;
    color: rgba(255,255,255,0.9);
    margin-bottom: 4px;
  }
  .user-address {
    font-size: 12px;
    font-weight: 600;
    font-family: 'SF Mono', 'Fira Code', monospace;
    color: rgba(255,255,255,0.5);
  }
  .date-info {
    text-align: right;
  }
  .date {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
  }
  .chain {
    font-size: 10px;
    font-weight: 600;
    color: rgba(255,255,255,0.35);
    margin-top: 2px;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 36px;
    background: rgba(0,0,0,0.15);
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .footer-text {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.3);
  }
  .footer-link {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.5);
    text-decoration: none;
  }
  .footer-link:hover { color: rgba(255,255,255,0.8); }
</style>
</head>
<body>
  <div class="card">
    <div class="card-inner">
      <div class="header">
        <div class="network-badge">SecureTransac Network &middot; ${netName}</div>
        <div class="shield">${rank.emoji}</div>
      </div>
      <div class="rank-section">
        <div class="rank-label">Reputation Rank</div>
        <div class="rank-name">${rank.label}</div>
      </div>
      <div class="score-section">
        <div>
          <div class="score-label">Trust Score</div>
          <div class="score-value">${scorePercent}</div>
        </div>
      </div>
      <div class="identity">
        <div class="user-info">
          <div class="user-name">${displayName}</div>
          <div class="user-address">${shortAddr}</div>
        </div>
        <div class="date-info">
          <div class="date">${date}</div>
          <div class="chain">Soulbound &middot; Non-Transferable</div>
        </div>
      </div>
    </div>
    <div class="footer">
      <span class="footer-text">ERC-721S &middot; Soulbound Identity</span>
      <a href="https://securetransac.network" class="footer-link" target="_blank">securetransac.network</a>
    </div>
  </div>
</body>
</html>`;
}

export { generateCardHTML, getRank };
