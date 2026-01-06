const persistence = require('./persistenceService');
const web3Service = require('./web3Service');

class AIScoreService {
    calculateScore(address) {
        const userData = persistence.getUser(address);
        let score = userData.trustScore || 0.5;
        
        // Base scoring logic remains consistent with event history
        // but we add dynamic weight here.
        const historyScore = (userData.transactions.length * 0.02) - (userData.complaints.length * 0.15);
        
        return Math.max(0, Math.min(1, score + historyScore));
    }

    async processTransaction(from, to, amount) {
        console.log(`[AI] Processing Transaction: ${amount} from ${from} to ${to}`);
        
        const sender = persistence.getUser(from);
        const receiver = persistence.getUser(to);

        // Logic: Interacting with low-trust users reduces your score
        if (receiver.trustScore < 0.4) {
            sender.trustScore -= 0.1;
            persistence.incrementBlockedTransactions(); // Track as "blocked" (or flagged)
            console.log(`[AI] Penalty: ${from} interacted with suspicious receiver ${to}`);
        }

        // Logic: High value transactions increase score IF they are from trusted users
        if (amount > 100 && sender.trustScore > 0.7) {
            sender.trustScore += 0.01;
        }

        sender.transactions.push({ type: 'OUT', to, amount, timestamp: Date.now() });
        receiver.transactions.push({ type: 'IN', from, amount, timestamp: Date.now() });

        persistence.updateUser(from, sender);
        persistence.updateUser(to, receiver);

        await this.processEvaluation(from);
        await this.processEvaluation(to);
    }

    async processReport(reporter, target, text) {
        console.log(`[AI] Analyzing Report from ${reporter} against ${target}: "${text}"`);
        
        const targetUser = persistence.getUser(target);
        const reporterUser = persistence.getUser(reporter);

        // Logic: Weighted reporting. High trust reporters have more impact.
        const impactWeight = reporterUser.trustScore > 0.8 ? 0.2 : 0.05;
        
        // Mock Sentiment/Keyword analysis
        const redFlags = ['scam', 'fraud', 'steal', 'theft', 'fake', 'stolen'];
        let flagCount = 0;
        redFlags.forEach(word => {
            if (text.toLowerCase().includes(word)) flagCount++;
        });

        if (flagCount > 0) {
            targetUser.trustScore -= (impactWeight * flagCount);
            targetUser.complaints.push({ reporter, text, timestamp: Date.now(), severity: flagCount });
            persistence.updateUser(target, targetUser);
            await this.processEvaluation(target);
        }
    }

    async processEvaluation(address) {
        const score = this.calculateScore(address);
        persistence.updateUser(address, { trustScore: score });
        
        let category = 'medium';
        if (score <= 0.2) category = 'high';
        else if (score >= 0.8) category = 'low';
        persistence.incrementEvaluations(category);

        try {
            await web3Service.updateScore(address, score);
        } catch (e) {
            console.error("Web3 Sync Failed:", e.message);
        }
        return { address, score, status: category };
    }

    async manualOverride(address, action, reason) {
        console.log(`[AI] Manual Override: ${action} for ${address}. Reason: ${reason}`);
        
        let newScore = 0.5;
        if (action === 'whitelist') newScore = 0.95;
        else if (action === 'blacklist') newScore = 0.05;
        else if (action === 'reset') newScore = 0.5;

        const user = persistence.getUser(address);
        user.trustScore = newScore;
        // Record the override as a complaint with ADMIN reporter
        user.complaints.push({ 
            reporter: 'ADMIN', 
            text: `Manual ${action}: ${reason}`, 
            timestamp: Date.now(), 
            severity: action === 'blacklist' ? 5 : 0 
        });
        
        persistence.updateUser(address, user);
        return await this.processEvaluation(address);
    }
}

module.exports = new AIScoreService();
