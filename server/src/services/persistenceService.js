const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

class PersistenceService {
    constructor() {
        this.dbPath = path.join(__dirname, '../../data/database.sqlite');
        this.dbPromise = this._init();
    }

    async _init() {
        const db = await open({
            filename: this.dbPath,
            driver: sqlite3.Database
        });

        // Initialize Tables
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                address TEXT PRIMARY KEY,
                role TEXT DEFAULT 'user',
                registrationDate TEXT,
                data TEXT -- JSON for leftovers
            );

            CREATE TABLE IF NOT EXISTS analytics (
                key TEXT PRIMARY KEY,
                value TEXT -- JSON value
            );

            CREATE TABLE IF NOT EXISTS authorities (
                address TEXT PRIMARY KEY,
                data TEXT -- JSON full object
            );

            CREATE TABLE IF NOT EXISTS verification_requests (
                id TEXT PRIMARY KEY,
                userAddress TEXT,
                companyAddress TEXT,
                status TEXT,
                data TEXT -- JSON full object
            );

            CREATE TABLE IF NOT EXISTS appeals (
                id TEXT PRIMARY KEY,
                userAddress TEXT,
                status TEXT,
                data TEXT -- JSON full object
            );

            CREATE TABLE IF NOT EXISTS stealth_links (
                stealthAddress TEXT PRIMARY KEY,
                mainAddress TEXT
            );

            CREATE TABLE IF NOT EXISTS nonces (
                address TEXT PRIMARY KEY,
                nonce TEXT
            );
        `);

        // Initialize Analytics if empty
        const analytics = await db.get('SELECT value FROM analytics WHERE key = ?', 'global');
        if (!analytics) {
            const initial = {
                totalEvaluations: 0,
                blockedTransactions: 0,
                riskDistribution: { high: 0, medium: 0, low: 0 },
                riskHeatmap: Array.from({ length: 4 }, () => Array(7).fill(0)),
                evaluationVelocity: Array(7).fill({ label: '', value: 0 })
            };
            await db.run('INSERT INTO analytics (key, value) VALUES (?, ?)', 'global', JSON.stringify(initial));
        }

        return db;
    }

    async getDb() {
        return this.dbPromise;
    }

    // --- Users ---

    async getUser(address) {
        const db = await this.getDb();
        const addr = address.toLowerCase();
        const row = await db.get('SELECT * FROM users WHERE address = ?', addr);
        
        if (!row) return { role: 'user', transactions: [], complaints: [], trustScore: 0.5 };
        
        const data = row.data ? JSON.parse(row.data) : {};
        return {
            ...data,
            address: row.address,
            role: row.role,
            registrationDate: row.registrationDate
        };
    }

    async register(address, role, metadata = {}) {
        const db = await this.getDb();
        const addr = address.toLowerCase();
        
        const existing = await this.getUser(addr);
        const merged = { ...existing, ...metadata };
        
        await db.run(`
            INSERT OR REPLACE INTO users (address, role, registrationDate, data)
            VALUES (?, ?, ?, ?)
        `, [
            addr, 
            role || existing.role || 'user', 
            merged.registrationDate || new Date().toISOString(),
            JSON.stringify(merged)
        ]);

        return this.getUser(addr);
    }

    async updateUser(address, update) {
        const db = await this.getDb();
        const addr = address.toLowerCase();
        const current = await this.getUser(addr);
        const merged = { ...current, ...update };
        
        await db.run(`
            INSERT OR REPLACE INTO users (address, role, registrationDate, data)
            VALUES (?, ?, ?, ?)
        `, [
            addr,
            merged.role,
            merged.registrationDate,
            JSON.stringify(merged)
        ]);
        return merged;
    }

    // --- Analytics ---

    async getAnalytics() {
        const db = await this.getDb();
        const row = await db.get('SELECT value FROM analytics WHERE key = ?', 'global');
        const data = row ? JSON.parse(row.value) : {};

        // Calculate dynamic metrics
        const userCount = (await db.get('SELECT COUNT(*) as count FROM users')).count;
        
        // Flagged addresses logic requires scanning all users or trusting the boolean in JSON
        // For simple migration, we'll skip dynamic flagged count or iterate all users (slow)
        // Let's iterate efficiently if needed, or just return static
        return {
            ...data,
            activeWallets: userCount,
            flaggedAddresses: 0 // Placeholder/Todo: optimize Query
        };
    }

    async incrementEvaluations(riskCategory) {
        const db = await this.getDb();
        const current = await this.getAnalytics();
        
        current.totalEvaluations = (current.totalEvaluations || 0) + 1;
        if (current.riskDistribution[riskCategory] !== undefined) {
             current.riskDistribution[riskCategory]++;
        }
        
        await db.run('INSERT OR REPLACE INTO analytics (key, value) VALUES (?, ?)', 'global', JSON.stringify(current));
    }

    async incrementBlockedTransactions() {
        const db = await this.getDb();
        const current = await this.getAnalytics();
        current.blockedTransactions = (current.blockedTransactions || 0) + 1;
        await db.run('INSERT OR REPLACE INTO analytics (key, value) VALUES (?, ?)', 'global', JSON.stringify(current));
    }

    async updateRiskHeatmap(heatmapData) {
        const db = await this.getDb();
        const current = await this.getAnalytics();
        current.riskHeatmap = heatmapData;
        await db.run('INSERT OR REPLACE INTO analytics (key, value) VALUES (?, ?)', 'global', JSON.stringify(current));
    }
    
    async updateEvaluationVelocity(velocityData) {
        const db = await this.getDb();
        const current = await this.getAnalytics();
        current.evaluationVelocity = velocityData;
        await db.run('INSERT OR REPLACE INTO analytics (key, value) VALUES (?, ?)', 'global', JSON.stringify(current));
    }

    async getRecentScoreUpdates() {
        // Since we removed scores from DB, this logic is deprecated unless we store history in 'data' JSON.
        // Assuming we rely on Chain, return empty.
        return [];
    }

    async getACLEntries() {
        // Return dummy or scan DB
        const db = await this.getDb();
        const rows = await db.all('SELECT address, role FROM users'); // Scan all
        return rows.map(r => ({
            address: r.address,
            trustScore: 0.5, // Deprecated
            addedBy: 'system',
            date: new Date().toISOString()
        }));
    }

    // --- Authorities ---

    async getAuthorities() {
        const db = await this.getDb();
        const rows = await db.all('SELECT data FROM authorities');
        return rows.map(r => JSON.parse(r.data));
    }

    async saveAuthority(address, metadata) {
        const db = await this.getDb();
        const addr = address.toLowerCase();
        
        const data = {
            id: addr,
            ...metadata,
            totalReports: 0,
            rejectedReports: 0,
            status: 'active',
            timestamp: Date.now()
        };
        
        await db.run('INSERT OR REPLACE INTO authorities (address, data) VALUES (?, ?)', addr, JSON.stringify(data));
    }

    async recordAuthorityReport(address) {
        // Read-Modify-Write
        const db = await this.getDb();
        const addr = address.toLowerCase();
        const row = await db.get('SELECT data FROM authorities WHERE address = ?', addr);
        if (row) {
            const data = JSON.parse(row.data);
            data.totalReports++;
            await db.run('UPDATE authorities SET data = ? WHERE address = ?', [JSON.stringify(data), addr]);
        }
    }

    async recordAuthorityRejection(address) {
        const db = await this.getDb();
        const addr = address.toLowerCase();
        const row = await db.get('SELECT data FROM authorities WHERE address = ?', addr);
        if (row) {
            const data = JSON.parse(row.data);
            data.rejectedReports++;
            if (data.totalReports >= 5) {
                const rate = data.rejectedReports / data.totalReports;
                if (rate > 0.25) data.status = 'revoked';
            }
            await db.run('UPDATE authorities SET data = ? WHERE address = ?', [JSON.stringify(data), addr]);
        }
    }

    async removeAuthority(address) {
        const db = await this.getDb();
        await db.run('DELETE FROM authorities WHERE address = ?', address.toLowerCase());
    }

    async updateAuthority(address, metadata) {
        const db = await this.getDb();
        const addr = address.toLowerCase();
        const row = await db.get('SELECT data FROM authorities WHERE address = ?', addr);
        if (!row) return null;
        
        const data = JSON.parse(row.data);
        const updated = { ...data, ...metadata, updatedAt: Date.now() };
        
        await db.run('UPDATE authorities SET data = ? WHERE address = ?', [JSON.stringify(updated), addr]);
        return updated;
    }

    // --- Verification Requests ---

    async getVerificationRequests(companyAddress = null) {
        const db = await this.getDb();
        let rows;
        if (companyAddress) {
             rows = await db.all('SELECT data FROM verification_requests WHERE companyAddress = ?', companyAddress.toLowerCase());
        } else {
             rows = await db.all('SELECT data FROM verification_requests');
        }
        return rows.map(r => JSON.parse(r.data));
    }
    
    async getVerificationRequestsForUser(userAddress) {
        const db = await this.getDb();
        const rows = await db.all('SELECT data FROM verification_requests WHERE userAddress = ?', userAddress.toLowerCase());
        return rows.map(r => JSON.parse(r.data));
    }

    async createVerificationRequest(userAddress, companyAddress, metadata = {}) {
        const db = await this.getDb();
        const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const data = {
            id,
            userAddress: userAddress.toLowerCase(),
            companyAddress: companyAddress.toLowerCase(),
            status: 'pending',
            timestamp: Date.now(),
            ...metadata
        };
        
        await db.run('INSERT INTO verification_requests (id, userAddress, companyAddress, status, data) VALUES (?, ?, ?, ?, ?)', 
            id, data.userAddress, data.companyAddress, 'pending', JSON.stringify(data));
        return data;
    }

    async updateVerificationRequestStatus(requestId, status, reviewerAddress) {
        const db = await this.getDb();
        const row = await db.get('SELECT data FROM verification_requests WHERE id = ?', requestId);
        if (!row) return null;
        
        const data = JSON.parse(row.data);
        data.status = status;
        data.reviewedBy = reviewerAddress.toLowerCase();
        data.reviewTimestamp = Date.now();
        
        await db.run('UPDATE verification_requests SET status = ?, data = ? WHERE id = ?', 
            status, JSON.stringify(data), requestId);
        return data;
    }

    // --- Appeals ---

    async getAppeals(userAddress = null) {
        const db = await this.getDb();
        if (userAddress) {
            const rows = await db.all('SELECT data FROM appeals WHERE userAddress = ?', userAddress.toLowerCase());
            return rows.map(r => JSON.parse(r.data));
        }
        const rows = await db.all('SELECT data FROM appeals');
        return rows.map(r => JSON.parse(r.data));
    }

    async createAppeal(userAddress, reason, currentScore, metadata = {}) {
        const db = await this.getDb();
        const id = `apl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const data = {
            id,
            userAddress: userAddress.toLowerCase(),
            reason,
            currentScore,
            status: 'pending',
            timestamp: Date.now(),
            ...metadata
        };
        
        await db.run('INSERT INTO appeals (id, userAddress, status, data) VALUES (?, ?, ?, ?)', 
            id, userAddress.toLowerCase(), 'pending', JSON.stringify(data));
        return data;
    }

    async updateAppealStatus(appealId, status, reviewerAddress, comment = "") {
        const db = await this.getDb();
        const row = await db.get('SELECT data FROM appeals WHERE id = ?', appealId);
        if (!row) return null;
        
        const data = JSON.parse(row.data);
        data.status = status;
        data.reviewedBy = reviewerAddress.toLowerCase();
        data.reviewComment = comment;
        data.reviewTimestamp = Date.now();
        
        await db.run('UPDATE appeals SET status = ?, data = ? WHERE id = ?', 
            status, JSON.stringify(data), appealId);
        return data;
    }

    // --- Security / Nonces ---

    async getNonce(address) {
        const db = await this.getDb();
        const addr = address.toLowerCase();
        const row = await db.get('SELECT nonce FROM nonces WHERE address = ?', addr);
        
        if (!row) {
            return await this.rotateNonce(addr);
        }
        return row.nonce;
    }

    async rotateNonce(address) {
        const db = await this.getDb();
        const addr = address.toLowerCase();
        const nonce = `SECURE_TRANSAC_AUTH_CHALLENGE_${Math.floor(Math.random() * 1000000)}_${Date.now()}`;
        
        await db.run('INSERT OR REPLACE INTO nonces (address, nonce) VALUES (?, ?)', addr, nonce);
        return nonce;
    }

    async clearNonce(address) {
        const db = await this.getDb();
        await db.run('DELETE FROM nonces WHERE address = ?', address.toLowerCase());
    }

    async linkStealthAddress(stealthAddr, mainAddr) {
        const db = await this.getDb();
        const s = stealthAddr.toLowerCase();
        const m = mainAddr.toLowerCase();
        await db.run('INSERT OR REPLACE INTO stealth_links (stealthAddress, mainAddress) VALUES (?, ?)', s, m);
        console.log(`[Persistence] Linked Stealth Address ${s} -> ${m}`);
    }

    async resolveAddress(address) {
        const db = await this.getDb();
        const addr = address.toLowerCase();
        const row = await db.get('SELECT mainAddress FROM stealth_links WHERE stealthAddress = ?', addr);
        if (row) {
             console.log(`[Persistence] Resolved Stealth Address ${addr} -> ${row.mainAddress}`);
             return row.mainAddress;
        }
        return null;
    }
}

module.exports = new PersistenceService();
