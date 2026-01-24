const persistence = require('./persistenceService');
const web3Service = require('./web3Service');

class AIScoreService {
    async calculateScore(address) {
        const [transactions, reports, onChainScore] = await Promise.all([
            web3Service.getTransactionHistory(address),
            web3Service.getReports(address),
            web3Service.getScore(address)
        ]);
        
        // Base score from contract
        let baseScore = Number(onChainScore) / 100;
        
        // 1. Historical Analytics Weight
        const historyScore = (transactions.length * 0.02) - (reports.length * 0.15);

        // 2. Temporal Anomaly Detection
        const anomalyPenalty = this.detectTemporalAnomalies(transactions);
        if (anomalyPenalty > 0) {
            console.log(`[AI] Temporal Anomaly Detected for ${address}: Penalty -${anomalyPenalty}`);
        }

        // 3. Social Graph Scoring (Guilt by Association)
        const socialRisk = await this.calculateSocialGraphRisk(address, transactions);
        if (socialRisk !== 0) {
            console.log(`[AI] Social Graph Impact for ${address}: ${socialRisk > 0 ? '+' : ''}${socialRisk}`);
        }
        
        return Math.max(0, Math.min(1, baseScore + historyScore - anomalyPenalty + socialRisk));
    }

    async calculateSocialGraphRisk(targetAddress, transactions) {
        if (!transactions || transactions.length === 0) return 0;

        // Get unique partners (limit to last 10 for performance)
        const partners = new Set();
        transactions.slice(0, 10).forEach(tx => {
            if (tx.from.toLowerCase() !== targetAddress.toLowerCase()) partners.add(tx.from);
            if (tx.to.toLowerCase() !== targetAddress.toLowerCase()) partners.add(tx.to);
        });

        if (partners.size === 0) return 0;

        // Fetch scores of partners
        const scores = await Promise.all(Array.from(partners).map(addr => web3Service.getScore(addr)));
        
        // Calculate Average Network Trust
        const totalPartnerScore = scores.reduce((sum, s) => sum + Number(s), 0);
        const avgPartnerScore = totalPartnerScore / partners.size;

        // Algorithm:
        // - If average partner score < 30 (Bad neighborhood) -> Penalty -0.15
        // - If average partner score > 80 (Elite circle) -> Boost +0.05
        // - Individual interaction with Blacklisted user (< 20) -> Immediate Penalty -0.1
        
        let riskModifier = 0;

        if (avgPartnerScore < 30) riskModifier -= 0.15;
        else if (avgPartnerScore > 80) riskModifier += 0.05;

        // Check for direct bad actor contact
        const hasBadActorContact = scores.some(s => Number(s) <= 20);
        if (hasBadActorContact) riskModifier -= 0.1;

        return riskModifier;
    }

    detectTemporalAnomalies(transactions) {
        if (!transactions || transactions.length < 5) return 0;

        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * 60 * 60 * 1000;

        // Anomaly 1: Frequency Spike (More than 10 tx in last hour)
        const recentTx = transactions.filter(tx => (now - tx.timestamp) < oneHour);
        if (recentTx.length > 10) return 0.2; // High penalty for spamming

        // Anomaly 2: Volume/Value Spike
        // Calculate average volume of past transactions (excluding last 24h to establish baseline)
        const pastTx = transactions.filter(tx => (now - tx.timestamp) > oneDay);
        if (pastTx.length > 5) {
            const avgVolume = pastTx.reduce((sum, tx) => sum + tx.amount, 0) / pastTx.length;
            const recentVolume = recentTx.reduce((sum, tx) => sum + tx.amount, 0);
            
            // If recent volume is > 5x average -> Suspicious
            if (recentVolume > (avgVolume * 5) && recentVolume > 10) { 
                return 0.15; 
            }
        }

        return 0;
    }

    async processTransaction(from, to, amount) {
        console.log(`[AI] Processing Transaction: ${amount} from ${from} to ${to}`);
        
        const [senderScore, receiverScore] = await Promise.all([
            web3Service.getScore(from),
            web3Service.getScore(to)
        ]);

        let senderShift = 0;
        // Logic: Interacting with low-trust users reduces your score
        if (Number(receiverScore) < 40) {
            senderShift = -0.1;
            persistence.incrementBlockedTransactions();
            console.log(`[AI] Penalty: ${from} interacted with suspicious receiver ${to}`);
        }

        // Logic: High value transactions increase score IF they are from trusted users
        if (amount > 100 && Number(senderScore) > 70) {
            senderShift += 0.01;
        }

        // Record the transaction ON-CHAIN as an event
        await web3Service.recordTransaction(from, to, amount);

        if (senderShift !== 0) {
            const currentScore = Number(senderScore) / 100;
            await web3Service.updateScore(from, currentScore + senderShift);
        }

        await this.processEvaluation(from);
        await this.processEvaluation(to);
        return "on-chain";
    }

    async processTransactionComment(from, target, txId, text, rating) {
        console.log(`[AI] Processing Comment from ${from} on ${target} for TX ${txId}: "${text}" (Rating: ${rating})`);
        
        const targetUser = persistence.getUser(target);
        const fromUser = persistence.getUser(from);

        // Logic: Sentiment-based adjustment.
        // rating is 1-5. 3 is neutral.
        let sentimentShift = (rating - 3) * 0.05;
        
        // Weight by reporter trust
        sentimentShift *= fromUser.trustScore;

        targetUser.trustScore += sentimentShift;
        targetUser.complaints.push({ 
            reporter: from, 
            text, 
            timestamp: Date.now(), 
            type: 'COMMENT',
            txId,
            rating 
        });

        persistence.updateUser(target, targetUser);
        await this.processEvaluation(target);
    }

    async processReport(reporter, target, text) {
        console.log(`[AI] Analyzing Report from ${reporter} against ${target}: "${text}"`);
        
        const isAnonymous = reporter === 'ANONYMOUS';

        const [targetScore, reporterScore] = await Promise.all([
            web3Service.getScore(target),
            isAnonymous ? Promise.resolve(60) : web3Service.getScore(reporter)
        ]);

        const authorities = persistence.getAuthorities();
        const auth = isAnonymous ? null : authorities.find(a => (a.id || '').toLowerCase() === reporter.toLowerCase());
        
        if (auth && auth.status === 'revoked') {
            console.warn(`[AI] Ignoring report from revoked authority: ${reporter}`);
            return;
        }

        const impactWeight = auth ? 0.3 : (Number(reporterScore) > 80 ? 0.2 : 0.05);
        
        const redFlags = ['scam', 'fraud', 'steal', 'theft', 'fake', 'stolen'];
        let flagCount = 0;
        redFlags.forEach(word => {
            if (text.toLowerCase().includes(word)) flagCount++;
        });

        if (flagCount > 0 || auth) {
            const finalFlagCount = flagCount || 1;
            let newScore = (Number(targetScore) / 100) - (impactWeight * finalFlagCount);
            newScore = Math.max(0, Math.min(1, newScore));
            
            // Log the report on-chain
            await web3Service.submitReport(target, text);
            // Update the score on-chain
            await web3Service.updateScore(target, newScore);
            
            if (auth) {
                persistence.recordAuthorityReport(reporter);
            }
            
            await this.processEvaluation(target);
        }
    }

    async processEvaluation(address) {
        const score = await this.calculateScore(address);
        
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

    async manualOverride(address, action, reason, targetScore = null) {
        console.log(`[AI] Manual Override: ${action} for ${address}. Reason: ${reason} (Target: ${targetScore})`);
        
        let newScore = 0.5;
        if (targetScore !== null) {
            newScore = parseFloat(targetScore);
        } else if (action === 'whitelist') {
            newScore = 0.95;
        } else if (action === 'blacklist') {
            newScore = 0.05;
        } else if (action === 'reset') {
            newScore = 0.5;
        }

        const user = persistence.getUser(address);
        
        // REPUTATION LOGIC: If unblocking/resetting, check for authority reports to penalize
        if (action === 'whitelist' || action === 'reset') {
            const authorityReports = user.complaints.filter(c => c.isAuthority);
            authorityReports.forEach(report => {
                console.log(`[AI] Penalizing authority ${report.reporter} for incorrect report on ${address}`);
                persistence.recordAuthorityRejection(report.reporter);
            });
        }

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
