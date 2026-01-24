import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../layout/PageWrapper';

const RiskWarRoom = () => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      // Fetching heatmap and clusters to simulate network graph
      const [heatmapRes, sybilRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/analytics/heatmap'),
        axios.get('http://localhost:5000/api/admin/analytics/sybil', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const mockNodes = heatmapRes.data.map(n => ({
        ...n,
        type: sybilRes.data.clusters?.some(c => c.addresses.includes(n.address)) ? 'sybil' : 'normal'
      }));

      setNodes(mockNodes);
    } catch (err) {
      console.error("Failed to load war room data", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper title="AI-Risk War Room">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Network Visualizer */}
        <div className="lg:col-span-2 bg-black border border-gray-800 rounded-3xl relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>
          
          {/* Mock SVG Graph Visualization */}
          <svg className="w-full h-full p-10">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {nodes.map((node, i) => {
              const x = 100 + (i * 85) % 600;
              const y = 100 + (i * 123) % 400;
              const isHighRisk = node.trustScore < 0.3 || node.type === 'sybil';
              
              return (
                <g key={node.address} onClick={() => setSelectedNode(node)} className="cursor-pointer group">
                  {/* Connection Lines (Simulated to center) */}
                  <line 
                    x1={x} y1={y} x2="400" y2="300" 
                    className={`stroke-current ${isHighRisk ? 'text-red-900/30' : 'text-blue-900/30'}`} 
                    strokeWidth="1" 
                  />
                  
                  {/* Node Circle */}
                  <circle 
                    cx={x} cy={y} r={isHighRisk ? "8" : "6"} 
                    className={`fill-current transition-all duration-500 ${isHighRisk ? 'text-red-500 animate-pulse' : 'text-cyan-400 opacity-60'}`}
                    filter={isHighRisk ? "url(#glow)" : ""}
                  />
                  
                  {/* Node Label on Hover */}
                  <text 
                    x={x + 12} y={y + 4} 
                    className="fill-gray-500 text-[8px] font-mono hidden group-hover:block pointer-events-none"
                  >
                    {node.address.slice(0, 8)}...
                  </text>
                </g>
              );
            })}
            
            {/* Legend */}
            <g transform="translate(20, 650)">
              <circle cx="0" cy="0" r="4" className="fill-red-500" />
              <text x="10" y="4" className="fill-gray-400 text-[10px]">High Risk / Sybil Cluster</text>
              <circle cx="150" cy="0" r="4" className="fill-cyan-400" />
              <text x="160" y="4" className="fill-gray-400 text-[10px]">Verified Entity</text>
            </g>
          </svg>

          <div className="absolute top-6 left-6">
            <div className="flex items-center gap-2 bg-red-600/10 border border-red-500/20 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Threat Feed</span>
            </div>
          </div>
        </div>

        {/* Intelligence Side Panel */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
                <h3 className="text-white font-bold mb-4">Risk Intelligence</h3>
                {selectedNode ? (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-4">
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Entity Address</div>
                            <div className="text-xs font-mono text-cyan-400 break-all">{selectedNode.address}</div>
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
                        <button className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all">
                            Initiate Global Blacklist
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-4xl mb-4 opacity-20">📡</div>
                        <p className="text-gray-500 text-sm italic">Select a node to inspect behavioral intelligence</p>
                    </div>
                )}
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
                <h3 className="text-white font-bold mb-4">Network Resilience</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase mb-1">
                            <span>System Entropy</span>
                            <span className="text-cyan-400">Low (12.4%)</span>
                        </div>
                        <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-600 w-[12%]"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase mb-1">
                            <span>Sybil Isolation</span>
                            <span className="text-green-500">99.8%</span>
                        </div>
                        <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                            <div className="h-full bg-green-600 w-[99%]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default RiskWarRoom;
