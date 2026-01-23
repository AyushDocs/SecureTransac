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
                verificationRequests: [],
                nonces: {},
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
        if (!data.verificationRequests) data.verificationRequests = [];
        if (!data.nonces) data.nonces = {};
        return data;
    }

    _save(data) {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
    }

    getUser(address) {
        const addr = address.toLowerCase();
        return this.data.users[addr] || { transactions: [], complaints: [], trustScore: 0.5, role: 'user' };
    }

    register(address, role, metadata = {}) {
        const addr = address.toLowerCase();
        const existing = this.getUser(addr);
        this.data.users[addr] = {
            ...existing,
            ...metadata,
            role: role || 'user',
            registrationDate: new Date().toISOString()
        };
        this._save(this.data);
        return this.data.users[addr];
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
            totalReports: 0,
            rejectedReports: 0,
            status: 'active',
            timestamp: Date.now()
        };
        this._save(this.data);
    }

    updateAuthority(address, metadata) {
        const addr = address.toLowerCase();
        if (!this.data.authorities[addr]) return null;
        this.data.authorities[addr] = {
            ...this.data.authorities[addr],
            ...metadata,
            updatedAt: Date.now()
        };
        this._save(this.data);
        return this.data.authorities[addr];
    }

    recordAuthorityReport(address) {
        const addr = address.toLowerCase();
        if (this.data.authorities[addr]) {
            this.data.authorities[addr].totalReports++;
            this._save(this.data);
        }
    }

    recordAuthorityRejection(address) {
        const addr = address.toLowerCase();
        if (this.data.authorities[addr]) {
            this.data.authorities[addr].rejectedReports++;
            
            // Auto-revocation logic: > 25% rejection rate after at least 5 reports
            const auth = this.data.authorities[addr];
            if (auth.totalReports >= 5) {
                const rejectionRate = auth.rejectedReports / auth.totalReports;
                if (rejectionRate > 0.25) {
                    auth.status = 'revoked';
                    console.log(`[SecureTransac] Authority ${addr} auto-revoked due to low accuracy (${(rejectionRate * 100).toFixed(1)}%)`);
                }
            }
            this._save(this.data);
        }
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

    getVerificationRequests(companyAddress = null) {
        if (companyAddress) {
            return this.data.verificationRequests.filter(r => r.companyAddress.toLowerCase() === companyAddress.toLowerCase());
        }
        return this.data.verificationRequests;
    }

    getVerificationRequestsForUser(userAddress) {
        return this.data.verificationRequests.filter(r => r.userAddress.toLowerCase() === userAddress.toLowerCase());
    }

    createVerificationRequest(userAddress, companyAddress, metadata = {}) {
        const request = {
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userAddress: userAddress.toLowerCase(),
            companyAddress: companyAddress.toLowerCase(),
            status: 'pending',
            timestamp: Date.now(),
            ...metadata
        };
        this.data.verificationRequests.push(request);
        this._save(this.data);
        return request;
    }

    updateVerificationRequestStatus(requestId, status, reviewerAddress) {
        const index = this.data.verificationRequests.findIndex(r => r.id === requestId);
        if (index === -1) return null;
        
        this.data.verificationRequests[index].status = status;
        this.data.verificationRequests[index].reviewedBy = reviewerAddress.toLowerCase();
        this.data.verificationRequests[index].reviewTimestamp = Date.now();
        
        this._save(this.data);
        return this.data.verificationRequests[index];
    }

    getNonce(address) {
        const addr = address.toLowerCase();
        if (!this.data.nonces[addr]) {
            this.rotateNonce(addr);
        }
        return this.data.nonces[addr];
    }

    rotateNonce(address) {
        const addr = address.toLowerCase();
        const nonce = `SECURE_TRANSAC_AUTH_CHALLENGE_${Math.floor(Math.random() * 1000000)}_${Date.now()}`;
        this.data.nonces[addr] = nonce;
        this._save(this.data);
        return nonce;
    }

    clearNonce(address) {
        const addr = address.toLowerCase();
        delete this.data.nonces[addr];
        this._save(this.data);
    }
}

module.exports = new PersistenceService();
