const fs = require('fs');
const path = require('path');

class PersistenceService {
    constructor() {
        this.dbPath = path.join(__dirname, '../../data/db.json');
        this.data = this._load();
    }

    _load() {
        if (!fs.existsSync(this.dbPath)) {
            const initial = { users: {}, analytics: { totalEvaluations: 0, riskDistribution: { high: 0, medium: 0, low: 0 } } };
            this._save(initial);
            return initial;
        }
        return JSON.parse(fs.readFileSync(this.dbPath));
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
        return this.data.analytics;
    }

    incrementEvaluations(riskCategory) {
        this.data.analytics.totalEvaluations++;
        this.data.analytics.riskDistribution[riskCategory]++;
        this._save(this.data);
    }
}

module.exports = new PersistenceService();
