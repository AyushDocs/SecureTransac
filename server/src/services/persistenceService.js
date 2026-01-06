const fs = require('fs');
const path = require('path');

class PersistenceService {
    constructor() {
        this.dbPath = path.join(__dirname, '../../data/db.json');
        this.data = this._load();
    }

    _load() {
        if (!fs.existsSync(this.dbPath)) {
            const initial = { 
                users: {}, 
                authorities: {},
                analytics: { 
                    totalEvaluations: 0, 
                    blockedTransactions: 0,
                    riskDistribution: { high: 0, medium: 0, low: 0 },
                    riskHeatmap: Array.from({ length: 4 }, () => Array(7).fill(0)),
                    evaluationVelocity: [
                        { label: 'Mon', value: 0 },
                        { label: 'Tue', value: 0 },
                        { label: 'Wed', value: 0 },
                        { label: 'Thu', value: 0 },
                        { label: 'Fri', value: 0 },
                        { label: 'Sat', value: 0 },
                        { label: 'Sun', value: 0 }
                    ]
                } 
            };
            this._save(initial);
            return initial;
        }
        const data = JSON.parse(fs.readFileSync(this.dbPath));
        // Migration/Initialization for new fields if they don't exist
        if (!data.analytics.blockedTransactions) data.analytics.blockedTransactions = 0;
        if (!data.authorities) data.authorities = {};
        if (!data.analytics.riskHeatmap) {
            data.analytics.riskHeatmap = Array.from({ length: 4 }, () => Array(7).fill(0));
        }
        if (!data.analytics.evaluationVelocity) {
            data.analytics.evaluationVelocity = [
                { label: 'Mon', value: 0 },
                { label: 'Tue', value: 0 },
                { label: 'Wed', value: 0 },
                { label: 'Thu', value: 0 },
                { label: 'Fri', value: 0 },
                { label: 'Sat', value: 0 },
                { label: 'Sun', value: 0 }
            ];
        }
        return data;
    }

    _save(data) {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
    }

    getUser(address) {
        return this.data.users[address.toLowerCase()] || { transactions: [], complaints: [], trustScore: 0.5 };
    }

    updateUser(address, update) {
        const addr = address.toLowerCase();
        this.data.users[addr] = { ...this.getUser(addr), ...update };
        this._save(this.data);
    }

    getAnalytics() {
        // Calculate dynamic metrics
        const users = Object.values(this.data.users);
        const activeWallets = users.length;
        const flaggedAddresses = users.filter(u => u.trustScore < 0.4 || u.complaints.length > 0).length;

        return {
            ...this.data.analytics,
            activeWallets,
            flaggedAddresses
        };
    }

    getACLEntries() {
        return Object.entries(this.data.users).map(([address, data]) => ({
            address,
            trustScore: data.trustScore || 0.5,
            addedBy: data.overrideBy || 'system',
            date: data.overrideDate || new Date().toISOString().split('T')[0]
        }));
    }

    getRecentScoreUpdates() {
        const users = Object.entries(this.data.users)
            .filter(([_, data]) => data.scoreHistory && data.scoreHistory.length > 0)
            .map(([address, data]) => {
                const history = data.scoreHistory || [];
                const latest = history[history.length - 1];
                const previous = history.length > 1 ? history[history.length - 2] : { score: 0.5 };
                return {
                    address,
                    oldScore: previous.score,
                    newScore: latest.score,
                    timestamp: latest.timestamp || Date.now()
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        return users;
    }

    incrementEvaluations(riskCategory) {
        this.data.analytics.totalEvaluations++;
        if (this.data.analytics.riskDistribution[riskCategory] !== undefined) {
          this.data.analytics.riskDistribution[riskCategory]++;
        }
        this._save(this.data);
    }

    incrementBlockedTransactions() {
        this.data.analytics.blockedTransactions++;
        this._save(this.data);
    }

    getAuthorities() {
        return Object.values(this.data.authorities);
    }

    saveAuthority(address, metadata) {
        const addr = address.toLowerCase();
        this.data.authorities[addr] = {
            id: addr,
            ...metadata,
            timestamp: Date.now()
        };
        this._save(this.data);
    }

    removeAuthority(address) {
        const addr = address.toLowerCase();
        delete this.data.authorities[addr];
        this._save(this.data);
    }

    updateRiskHeatmap(heatmapData) {
        if (!Array.isArray(heatmapData) || heatmapData.length !== 4) return;
        this.data.analytics.riskHeatmap = heatmapData;
        this._save(this.data);
    }

    updateEvaluationVelocity(velocityData) {
        if (!Array.isArray(velocityData) || velocityData.length !== 7) return;
        this.data.analytics.evaluationVelocity = velocityData;
        this._save(this.data);
    }
}

module.exports = new PersistenceService();
