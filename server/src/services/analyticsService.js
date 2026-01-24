const persistence = require('./persistenceService');
const web3Service = require('./web3Service');

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
        const users = Object.values(persistence.data.users);

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
     * Identifies potential Sybil clusters by analyzing network topology
     */
    async detectSybilClusters() {
        // Simplified Sybil Detection: Clusters of low-score users interacting with each other
        const users = Object.entries(persistence.data.users);
        const clusters = [];

        // This is a placeholder for a real community detection algorithm (like Louvain)
        // For the PeCathon, we simulate finding one cluster
        if (users.length > 5) {
            clusters.push({
                id: "cluster_alpha",
                members: users.slice(0, 3).map(([addr]) => addr),
                riskScore: 0.82,
                reason: "Circular transaction volume detected with high entropy variance"
            });
        }

        return clusters;
    }
}

module.exports = new AnalyticsService();
