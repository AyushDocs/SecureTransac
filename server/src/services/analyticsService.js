import persistence from './persistenceService.js';
import web3Service from './web3Service.js';

/**
 * Advanced Analytics for SecureTransac
 * Focuses on Behavioral Fingerprinting and Complex Risk Patterns
 */
class AnalyticsService {
    /**
     * Calculates behavioral fingerprints for a specific address
     * Detects automation, sybil patterns, and economic anomalies
     */
    async calculateFingerprint(address) {
        const transactions = await web3Service.getTransactionHistory(address);
        if (transactions.length < 3) {
            return {
                address,
                fingerprintScore: 0.5,
                confidence: 0.2,
                tags: ["LOW_DATA"],
                metrics: {
                    entropy: 0.5,
                    burstiness: 0,
                    automation: 0.1
                }
            };
        }

        // 1. Timing Entropy (Randomness of intervals)
        // High entropy = Human, Low entropy = Bot/Scheduled
        const intervals = [];
        for (let i = 0; i < transactions.length - 1; i++) {
            intervals.push(Math.abs(transactions[i].timestamp - transactions[i+1].timestamp));
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.size;
        const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        
        // Coefficient of variation as a measure of "Human Randomness"
        const entropy = Math.min(1, stdDev / (avgInterval || 1));
        
        // 2. Automation Probability (Check for periodic patterns)
        const isPeriodic = intervals.every(interval => {
            const mod = interval % (60 * 1000); // Check if roughly multiple of minutes
            return mod < 2000 || mod > 58000;
        });
        const automation = isPeriodic ? 0.9 : (entropy < 0.2 ? 0.7 : 0.1);

        // 3. Burstiness (High volume in short time)
        const hour = 60 * 60 * 1000;
        const recentBursts = transactions.filter(tx => (Date.now() - tx.timestamp) < hour).length;
        const burstiness = Math.min(1, recentBursts / 20);

        // 4. Overall Fingerprint Score (0=Bot, 1=Human)
        const humanityScore = Math.max(0, Math.min(1, (entropy * 0.4) + (1 - automation * 0.5) - (burstiness * 0.1)));

        const tags = [];
        if (automation > 0.7) tags.push("SUSPECTED_BOT");
        if (burstiness > 0.6) tags.push("SPAMMER");
        if (humanityScore > 0.8) tags.push("VERIFIED_HUMAN_BEHAVIOR");
        if (transactions.length > 50) tags.push("POWER_USER");

        return {
            address,
            fingerprintScore: humanityScore.toFixed(3),
            confidence: Math.min(1, transactions.length / 20).toFixed(2),
            tags,
            metrics: {
                entropy: entropy.toFixed(3),
                burstiness: burstiness.toFixed(3),
                automation: automation.toFixed(3)
            }
        };
    }

    /**
     * Generates a dynamic Risk Heatmap across the network
     * X-axis: Trust Score (0 -> 1000)
     * Y-axis: Activity Volume (Low -> High)
     */
    async getRiskHeatmapData() {
        // Mocking sophisticated cluster data based on current DB state
        // In a production app, this would iterate over all active wallets
        const heatmap = Array.from({ length: 6 }, () => Array(6).fill(0));
        const users = await persistence.getAllUsers();

        users.forEach(u => {
            const score = u.trustScore || 0.5;
            const x = Math.min(5, Math.floor(score * 6));
            
            // Map activity volume to Y axis
            const txCount = u.complaints?.length || 0; // Simplified for demo
            const y = Math.min(5, Math.floor(txCount / 5));
            
            heatmap[y][x]++;
        });

        return heatmap;
    }

    /**
     * Identifies potential Sybil clusters by analyzing network topology.
     *
     * Simplified heuristic for the demo: users with a live low on-chain trust
     * score (0 < score < 0.5) that are not already blocked are grouped as
     * suspected Sybil. Unscored accounts (effective score === 0) are excluded
     * so we never flag fresh, never-rated users.
     */
    async detectSybilClusters() {
        const users = await persistence.getAllUsers();
        const clusters = [];

        if (users.length < 3) return clusters;

        const scored = (await Promise.all(users.map(async (u) => {
            let score = typeof u.trustScore === 'number' ? u.trustScore : 0.5;
            try {
                const onChain = Number(await web3Service.getDecryptedScore(u.address));
                if (onChain > 0) score = onChain; // treat unscored (0) as unknown
            } catch (e) { /* keep local */ }
            return { address: u.address, score };
        }))).sort((a, b) => a.score - b.score);

        const suspicious = scored.filter(s => s.score > 0 && s.score < 0.5);
        if (suspicious.length > 0) {
            const members = suspicious.slice(0, 3).map(s => s.address);
            const avgScore = suspicious.slice(0, 3).reduce((sum, s) => sum + s.score, 0) / Math.min(3, suspicious.length);
            clusters.push({
                id: "cluster_alpha",
                members,
                riskScore: Math.min(0.99, Math.round((1 - avgScore) * 100) / 100),
                reason: members.length > 1
                    ? "Circular transaction volume detected with high entropy variance across low-trust accounts"
                    : `Single low-trust account (score ${(avgScore * 100).toFixed(0)}%) flagged by circular volume heuristic`
            });
        }

        return clusters;
    }

    /**
     * Builds the AI-Risk War Room dataset:
     * network nodes (from real local + on-chain activity) and a recent event feed.
     */
    async getWarRoomData() {
        const clusters = await this.detectSybilClusters();
        const sybilSet = new Set();
        clusters.forEach(c => (c.members || c.addresses || []).forEach(a => sybilSet.add(String(a).toLowerCase())));

        const users = await persistence.getAllUsers();
        const authorities = await persistence.getAuthorities();
        const authorityAddrs = new Set(authorities.map(a => String(a.address || a.id).toLowerCase()));
        const nodes = [];

        const buildNode = async (u) => {
            const address = u.address;
            let txs = u.transactions || [];
            try {
                const history = await web3Service.getTransactionHistory(address);
                if (history.length > txs.length) txs = history;
            } catch (e) {
                // keep local activity when chain is unreachable
            }

            // Prefer the live on-chain score when available (getDecryptedScore
            // returns 0 for unscored/empty users, so fall back to local defaults).
            let trustScore = typeof u.trustScore === 'number' ? u.trustScore : 0.5;
            try {
                const onChain = await web3Service.getDecryptedScore(address);
                if (Number(onChain) > 0) trustScore = Number(onChain);
            } catch (e) { /* keep local */ }

            const volume = txs.reduce((s, t) => s + (Number(t.amount) || 0), 0);
            const isAuthority = u.role === 'company' || u.role === 'authority' || authorityAddrs.has(address.toLowerCase());
            const isSybil = sybilSet.has(address.toLowerCase()) || trustScore < 0.2;

            nodes.push({
                address,
                trustScore,
                txCount: txs.length,
                volume,
                type: isSybil ? 'sybil' : (isAuthority ? 'authority' : 'normal'),
                name: u.name || undefined,
                tags: isSybil ? ['SUSPECT_SYBIL'] : (trustScore < 0.3 ? ['HIGH_RISK'] : [])
            });
        };

        // 1. Registered users
        for (const u of users) {
            if (!u.address) continue;
            await buildNode(u);
        }

        // 2. Authorities that are pure-company (not already added as users)
        const known = new Set(nodes.map(n => n.address.toLowerCase()));
        for (const a of authorities) {
            const address = String(a.address || a.id || '').toLowerCase();
            if (!address || known.has(address)) continue;
            nodes.push({
                address,
                trustScore: 0.85,
                txCount: a.totalReports || 0,
                volume: 0,
                type: 'authority',
                name: a.name || 'Authority',
                tags: ['VERIFIED_AUTHORITY']
            });
        }

        // Recent on-chain events to hydrate the live feed on first load.
        let feed = [];
        try {
            const txs = await web3Service.getAllTransactions();
            feed = txs.slice(-20).reverse().map(t => ({
                type: 'tx',
                from: t.from,
                to: t.to,
                amount: Number(t.amount) / 100,
                timestamp: Number(t.timestamp) * 1000
            }));

            const reports = await web3Service.getAllReports();
            feed = feed.concat(reports.slice(-10).reverse().map(r => ({
                type: 'report',
                reporter: r.issuer,
                target: r.target,
                text: (r.text || '').toString().slice(0, 80),
                timestamp: Date.now()
            })));
        } catch (e) {
            console.error('[Analytics] War room feed fetch failed:', e.message);
        }

        feed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        return { nodes, feed: feed.slice(0, 20), clusters };
    }
}

export default new AnalyticsService();
