import axios from 'axios';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/config';
import PageWrapper from '../layout/PageWrapper';

const AdvancedAnalytics = () => {
    const [heatmap, setHeatmap] = useState([]);
    const [sybilClusters, setSybilClusters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchAddr, setSearchAddr] = useState('');
    const [fingerprint, setFingerprint] = useState(null);

    useEffect(() => {
        fetchGlobalData();
    }, []);

    const fetchGlobalData = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const headers = { Authorization: `Bearer ${token}` };

            const [hRes, sRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/analytics/heatmap`, { headers }),
                axios.get(`${API_BASE_URL}/admin/analytics/sybil`, { headers })
            ]);
            setHeatmap(hRes.data.heatmap);
            setSybilClusters(sRes.data.clusters);
        } catch (err) {
            console.error("Failed to fetch global analytics", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFingerprintSearch = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('userToken');
            const res = await axios.get(`${API_BASE_URL}/admin/analytics/fingerprint/${searchAddr}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFingerprint(res.data);
        } catch (err) {
            alert("No data for this address");
        }
    };

    return (
        <PageWrapper title="Advanced Network Analytics">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Behavioral Fingerprinting Search */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                        <h2 className="text-xl font-bold text-white mb-4">Behavioral Fingerprinting</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Analyze transaction timing entropy and value variance to distinguish humans from automated bots.
                        </p>
                        
                        <form onSubmit={handleFingerprintSearch} className="flex gap-4 mb-8">
                            <input 
                                type="text" 
                                placeholder="Enter wallet address (0x...)" 
                                value={searchAddr}
                                onChange={e => setSearchAddr(e.target.value)}
                                className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-3 text-white font-mono text-sm outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-all">
                                Analyze
                            </button>
                        </form>

                        {fingerprint && (
                            <div className="p-6 bg-gray-950 border border-gray-800 rounded-xl space-y-6 animate-in fade-in duration-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Humanity Score</div>
                                        <div className={`text-4xl font-black ${(fingerprint.fingerprintScore > 0.7) ? 'text-green-500' : 'text-yellow-500'}`}>
                                            {(fingerprint.fingerprintScore * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-end max-w-xs">
                                        {fingerprint.tags.map(t => (
                                            <span key={t} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded font-bold uppercase">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-2 text-center">Timing Entropy</div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-500" style={{ width: `${fingerprint.metrics.entropy * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-2 text-center">Automation Likelihood</div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500" style={{ width: `${fingerprint.metrics.automation * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-2 text-center">Burstiness Factor</div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500" style={{ width: `${fingerprint.metrics.burstiness * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sybil Detection */}
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                        <h2 className="text-xl font-bold text-white mb-4">Sybil Attack Clusters</h2>
                        <div className="space-y-4">
                            {sybilClusters.map(c => (
                                <div key={c.id} className="p-4 bg-red-500/5 border border-red-500/10 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-red-500 uppercase text-xs">{c.id}</h3>
                                        <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-bold">
                                            RISK: {(c.riskScore * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-3">{c.reason}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {c.members.map(m => (
                                            <code key={m} className="text-[10px] bg-gray-950 p-1 rounded text-gray-500">{m.slice(0, 12)}...</code>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {sybilClusters.length === 0 && <p className="text-xs text-gray-500 italic">Scanning network for circular transaction patterns...</p>}
                        </div>
                    </div>
                </div>

                {/* Risk Heatmap */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl h-full sticky top-6">
                        <h2 className="text-xl font-bold text-white mb-1">Risk Heatmap</h2>
                        <p className="text-xs text-gray-500 mb-6">Activity Volume (Y) vs Trust Score (X)</p>
                        
                        <div className="grid grid-cols-6 gap-1 aspect-square bg-gray-950 border border-gray-800 p-1 rounded-lg">
                            {heatmap.slice().reverse().map((row, y) => 
                                row.map((count, x) => {
                                    const opacity = Math.min(1, count / 5);
                                    let color = "bg-gray-900";
                                    if (count > 0) {
                                        // Trust Score (X) low -> left, high -> right. 
                                        // But our heatmap array index says 0 is low trust.
                                        // y is activity. 0 is high activity (due to reverse).
                                        if (x <= 1) color = "bg-red-500";
                                        else if (x <= 3) color = "bg-yellow-500";
                                        else color = "bg-green-500";
                                    }

                                    return (
                                        <div 
                                            key={`${x}-${y}`} 
                                            className={`${color} rounded-sm transition-all duration-1000 relative group`}
                                            style={{ opacity: count > 0 ? 0.3 + (opacity * 0.7) : 0.1 }}
                                        >
                                            {count > 0 && (
                                                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {count}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                        <div className="flex justify-between text-[8px] uppercase font-bold text-gray-600 mt-2 px-1">
                            <span>Bad / New</span>
                            <span>Aged / High Trust</span>
                        </div>
                        
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold">High Risk Sector</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Neutral Zone</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Safe Haven</span>
                            </div>
                        </div>

                        <div className="mt-auto pt-10 border-t border-gray-800/50 mt-10">
                            <div className="text-[10px] text-cyan-400 font-bold uppercase mb-2">Live Insights</div>
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                Clusters in top-left represent highly active addresses with low trust—priority for authority investigation.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </PageWrapper>
    );
};

export default AdvancedAnalytics;
