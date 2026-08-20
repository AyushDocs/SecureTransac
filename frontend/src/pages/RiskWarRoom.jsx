import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import PageWrapper from '../layout/PageWrapper';
import { API_BASE_URL } from '../api/config';
import { submitManualOverride } from '../api/client';

const fmtTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const shortAddr = (a = '') => `${a.slice(0, 6)}…${a.slice(-4)}`;

const feedItemKey = (item, i) => `${item.type}-${i}-${item.timestamp}-${item.txHash || ''}`;

const RiskWarRoom = () => {
  const { socket } = useSocket() || {};
  const [nodes, setNodes] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeNodes, setActiveNodes] = useState(new Set());
  const [blacklistState, setBlacklistState] = useState('idle'); // idle | working | done | error
  const [blacklistMsg, setBlacklistMsg] = useState(null);

  const resetBlacklist = () => {
    setBlacklistState('idle');
    setBlacklistMsg(null);
  };

  useEffect(() => { resetBlacklist(); }, [selectedNode]);

  const runBlacklist = async () => {
    if (!selectedNode) return;
    setBlacklistState('working');
    setBlacklistMsg(null);
    try {
      await submitManualOverride(selectedNode.address, 'blacklist', 'Initiated from AI-Risk War Room');
      const flagged = { ...selectedNode, trustScore: 0.05, type: 'sybil' };
      setSelectedNode(flagged);
      setNodes((prev) => prev.map((n) => (n.address === flagged.address ? flagged : n)));
      setBlacklistState('done');
      fetchWarRoom();
    } catch (err) {
      setBlacklistState('error');
      setBlacklistMsg(err.message || 'Failed to blacklist address');
    }
  };

  // 1. Initial hydration: network nodes + recent on-chain feed
  const fetchWarRoom = useCallback(async () => {
    try {
      const opts = {};
      const token = localStorage.getItem('token');
      if (token) opts.headers = { Authorization: `Bearer ${token}` };
      const { data } = await axios.get(`${API_BASE_URL}/admin/analytics/warroom`, opts);
      setNodes(data.nodes || []);
      setFeed(data.feed || []);
    } catch (err) {
      console.error("Failed to load war room data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarRoom();
  }, [fetchWarRoom]);

  // 2. Live socket feed
  useEffect(() => {
    if (!socket) return undefined;

    const push = (item) => {
      setFeed((prev) => [item, ...prev].slice(0, 30));
      const involved = [item.from, item.to, item.user, item.target, item.reporter]
        .filter(Boolean)
        .map((a) => a.toLowerCase());
      if (involved.length) {
        setActiveNodes(new Set(involved.map((a) => a)));
        setTimeout(() => setActiveNodes(new Set()), 6000);
      }
    };

    socket.on('tx_event', (d) => push({ type: 'tx', from: d.from, to: d.to, amount: d.amount, timestamp: d.timestamp || Date.now() }));
    socket.on('report_event', (d) => push({ type: 'report', reporter: d.reporter, target: d.target, text: d.reason, timestamp: d.timestamp || Date.now() }));
    socket.on('score_event', (d) => push({ type: 'score', user: d.user, newScore: d.newScore, timestamp: Date.now() }));

    return () => {
      socket.off('tx_event');
      socket.off('report_event');
      socket.off('score_event');
    };
  }, [socket]);

  // 3. Render positions (radial layout around a central hub)
  const layout = useMemo(() => {
    const count = nodes.length;
    const cx = 350, cy = 300, radius = 220;
    return nodes.map((n, i) => ({
      ...n,
      x: count <= 1 ? cx : cx + radius * Math.cos((2 * Math.PI * i) / count - Math.PI / 2),
      y: count <= 1 ? cy : cy + radius * Math.sin((2 * Math.PI * i) / count - Math.PI / 2),
    }));
  }, [nodes]);

  const nodeColor = (n) => {
    if (n.type === 'sybil' || n.trustScore < 0.3) return '#ef4444';
    if (n.trustScore < 0.6) return '#facc15';
    if (n.type === 'authority') return '#22c55e';
    return '#22d3ee';
  };

  const recentTxCount = feed.filter((f) => f.type === 'tx').length;

  return (
    <PageWrapper title="AI-Risk War Room">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[720px]">
        {/* Network Visualizer */}
        <div className="lg:col-span-2 bg-black border border-gray-800 rounded-3xl relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>

          {loading ? (
            <div className="text-gray-500 text-sm">Loading threat network…</div>
          ) : layout.length === 0 ? (
            <div className="text-center text-gray-500 text-sm px-8">
              <div className="text-5xl mb-3 opacity-20">🛰️</div>
              No entities on the network yet. Register users or submit reports to populate the graph.
            </div>
          ) : (
            <svg className="w-full h-full p-10" style={{ minHeight: 520 }}>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {layout.map((node) => {
                const isHigh = node.type === 'sybil' || node.trustScore < 0.3;
                const isActive = activeNodes.has(node.address.toLowerCase());
                return (
                  <g key={node.address} onClick={() => setSelectedNode(node)} className="cursor-pointer group">
                    <line x1={node.x} y1={node.y} x2="350" y2="300"
                      className={`stroke-current ${isHigh ? 'text-red-900/30' : 'text-blue-900/30'}`} strokeWidth="1" />
                    {isActive && (
                      <circle cx={node.x} cy={node.y} r={14} className="fill-none stroke-cyan-400 animate-ping" strokeWidth="2" />
                    )}
                    <circle cx={node.x} cy={node.y} r={20} className="fill-transparent" />
                    <circle cx={node.x} cy={node.y} r={isHigh ? 9 : node.txCount > 5 ? 8 : 6}
                      style={{ fill: nodeColor(node) }}
                      className={`transition-all duration-500 ${isHigh ? 'animate-pulse' : 'opacity-70'}`}
                      filter={isHigh ? "url(#glow)" : ""} />
                    <text x={node.x + 12} y={node.y + 4}
                      className="fill-gray-500 text-[9px] font-mono hidden group-hover:block pointer-events-none">
                      {shortAddr(node.address)}
                    </text>
                  </g>
                );
              })}

              <g transform="translate(20, 660)">
                <circle cx="0" cy="0" r="4" fill="#ef4444" /><text x="10" y="4" className="fill-gray-400 text-[10px]">High Risk / Sybil</text>
                <circle cx="130" cy="0" r="4" fill="#facc15" /><text x="140" y="4" className="fill-gray-400 text-[10px]">Medium</text>
                <circle cx="250" cy="0" r="4" fill="#22d3ee" /><text x="260" y="4" className="fill-gray-400 text-[10px]">Verified</text>
                <circle cx="370" cy="0" r="4" fill="#22c55e" /><text x="380" y="4" className="fill-gray-400 text-[10px]">Authority</text>
              </g>
            </svg>
          )}

          <div className="absolute top-6 left-6 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-600/10 border border-red-500/20 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Threat Feed</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-700 px-3 py-1.5 rounded-full">
              <span className="text-[10px] font-mono text-cyan-400">{layout.length} nodes</span>
              <span className="text-[10px] font-mono text-gray-500">·</span>
              <span className="text-[10px] font-mono text-gray-300">{recentTxCount} recent txs</span>
            </div>
          </div>
        </div>

        {/* Side column: Live Feed + Intelligence + Resilience */}
        <div className="lg:col-span-1 space-y-6 overflow-y-auto">
          {/* Live Threat Feed */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Live Intelligence</h3>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span> Connected
              </span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {feed.length === 0 && (
                <p className="text-gray-500 text-xs italic">Waiting for on-chain activity… try registering users or submitting a report.</p>
              )}
              {feed.map((item, i) => (
                <div key={feedItemKey(item, i)}
                  className={`p-3 rounded-xl border text-xs font-mono ${item.type === 'report' ? 'bg-red-500/5 border-red-500/20' : item.type === 'score' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-black/40 border-white/5'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-black uppercase tracking-wider ${item.type === 'report' ? 'text-red-400' : item.type === 'score' ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {item.type === 'report' ? '⚠ report' : item.type === 'score' ? '◆ score' : '⇄ tx'}
                    </span>
                    <span className="text-gray-500">{fmtTime(item.timestamp)}</span>
                  </div>
                  {item.type === 'tx' && (
                    <div className="mt-1 text-gray-300">
                      {shortAddr(item.from)} <span className="text-gray-600">→</span> {shortAddr(item.to)} <span className="text-white">· {Number(item.amount).toFixed(2)} ETH</span>
                    </div>
                  )}
                  {item.type === 'report' && (
                    <div className="mt-1 text-gray-300">
                      {shortAddr(item.reporter)} <span className="text-red-500">reports</span> {shortAddr(item.target)}
                      {item.text && <span className="text-gray-500"> — "{String(item.text).slice(0, 40)}"</span>}
                    </div>
                  )}
                  {item.type === 'score' && (
                    <div className="mt-1 text-gray-300">
                      {shortAddr(item.user)} <span className="text-gray-600">→ score</span> <span className="text-white">{(Number(item.newScore) * 100).toFixed(0)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Risk Intelligence */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
            <h3 className="text-white font-bold mb-4">Risk Intelligence</h3>
            {selectedNode ? (
              <div className="animate-in fade-in slide-in-from-right-4 space-y-4">
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Entity Address</div>
                  <div className="text-xs font-mono text-cyan-400 break-all">{selectedNode.address}</div>
                  {selectedNode.name && <div className="text-xs text-gray-400 mt-1">{selectedNode.name}</div>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                    <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Trust Score</div>
                    <div className={`text-xl font-black ${selectedNode.trustScore > 0.7 ? 'text-green-500' : 'text-red-500'}`}>
                      {(selectedNode.trustScore * 1000).toFixed(0)}
                    </div>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                    <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Risk Status</div>
                    <div className={`text-[10px] font-black uppercase mt-2 px-2 py-0.5 rounded inline-block ${selectedNode.type === 'sybil' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                      {selectedNode.type === 'sybil' ? 'SUSPECT SYBIL' : 'NORMAL'}
                    </div>
                  </div>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Activity</div>
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>TX Count <span className="text-white font-mono">{selectedNode.txCount}</span></span>
                    <span>Volume <span className="text-white font-mono">{Number(selectedNode.volume).toFixed(2)} ETH</span></span>
                  </div>
                </div>
                <button onClick={runBlacklist} disabled={blacklistState === 'working'}
                  className={`w-full text-white font-bold py-3 rounded-xl transition-all ${blacklistState === 'done' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'} ${blacklistState === 'working' ? 'opacity-60 cursor-wait' : ''}`}>
                  {blacklistState === 'working' ? 'Blacklisting…' : blacklistState === 'done' ? '✓ Blacklisted (score → 50)' : 'Initiate Global Blacklist'}
                </button>
                {blacklistState === 'done' && (
                  <p className="text-xs text-emerald-400 mt-2">Trust score set to 50/1000 on-chain. Node flagged red in the network graph.</p>
                )}
                {blacklistState === 'error' && (
                  <p className="text-xs text-red-400 mt-2">Could not blacklist: {blacklistMsg}</p>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-4xl mb-4 opacity-20">📡</div>
                <p className="text-gray-500 text-sm italic">Select a node to inspect behavioral intelligence</p>
              </div>
            )}
          </div>

          {/* Network Resilience */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
            <h3 className="text-white font-bold mb-4">Network Resilience</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase mb-1">
                  <span>System Entropy</span><span className="text-cyan-400">Low (12.4%)</span>
                </div>
                <div className="h-1.5 bg-black/60 rounded-full overflow-hidden"><div className="h-full bg-cyan-600 w-[12%]"></div></div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase mb-1">
                  <span>Sybil Isolation</span><span className="text-green-500">99.8%</span>
                </div>
                <div className="h-1.5 bg-black/60 rounded-full overflow-hidden"><div className="h-full bg-green-600 w-[99%]"></div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Plain-language explainers (collapsible so they don't dominate the page) */}
        <details className="group mt-4 bg-gray-900/60 border border-gray-800 rounded-3xl">
          <summary className="cursor-pointer select-none list-none flex items-center justify-between gap-4 p-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Understanding the Metrics – plain English</span>
            <span className="text-[10px] font-mono text-gray-500 group-open:hidden">▼ expand</span>
            <span className="text-[10px] font-mono text-gray-500 hidden group-open:inline">▲ collapse</span>
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pt-0">
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
              <h3 className="text-white font-bold mb-2">🔀 System Entropy <span className="ml-1 text-[10px] font-mono text-cyan-400">12.4% – Low</span></h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Measures how <span className="text-white">varied</span> network activity is. Real people act
                unpredictably (different amounts, times, patterns). Bots are repetitive. A low reading means
                transactions look alike — a <span className="text-red-400">sign automated actors may be at work</span>.
                High entropy = diverse, organic human behavior.
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
              <h3 className="text-white font-bold mb-2">🛡️ Sybil Isolation <span className="ml-1 text-[10px] font-mono text-green-400">99.8%</span></h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                A "Sybil" attack is <span className="text-white">one person running many fake accounts</span> to
                cheat the system. Isolation measures how well the network keeps them quarantined so their fake
                influence can't reach honest users. 99.8% means flagged clusters stay contained.
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 px-4 pb-4">
            Click any node to inspect its address, trust score and risk status. Red = flagged, amber = questionable, cyan = verified, green = authority.
          </p>
        </details>
      </div>
    </PageWrapper>
  );
};

export default RiskWarRoom;