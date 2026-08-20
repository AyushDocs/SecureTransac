import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SimpleNeuralNetwork from '../utils/SimpleNeuralNetwork.js';
import TextClassifier from '../utils/TextClassifier.js';
import persistence from './persistenceService.js';
import web3Service from './web3Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelWeightsPath = path.join(__dirname, '../utils/model_weights.json');
let modelWeights;
try {
    modelWeights = JSON.parse(fs.readFileSync(modelWeightsPath, 'utf8'));
} catch (e) {
    console.warn("[AI] Could not load model_weights.json via fs, assuming empty or handling in constructor");
    modelWeights = null;
}

class AIScoreService {
    constructor() {
        try {
            if (modelWeights) {
                this.model = SimpleNeuralNetwork.fromJSON(modelWeights);
                console.log("[AI] Neural Network Model Loaded Successfully");
            } else {
                this.model = null;
                console.warn("[AI] No model weights found, running in heuristic mode only.");
            }
        } catch (error) {
            console.error("[AI] Failed to load model weights:", error.message);
            this.model = null; 
        }

        // Local TF-IDF + Logistic Regression text model (trained in ai/notebook 05).
        // Scores report free-text -> P(fraud). Falls back to keyword heuristic when
        // the text has no vocabulary tokens or the weights are missing.
        this.textClassifier = new TextClassifier();
        this.textClassifierEnabled = this.textClassifier.weights !== null;

        // Manual overrides persist until explicitly reset (blacklist/whitelist)
        // so automatic re-evaluation cannot silently undo an operator decision.
        this.manualOverrides = new Map();
    }

    async calculateScore(address) {
        // Operator override wins over model/heuristic scoring.
        const override = this.manualOverrides.get(address.toLowerCase());
        if (override) return override.score;

        const [transactions, onChainScore] = await Promise.all([
            web3Service.getTransactionHistory(address),
            web3Service.getDecryptedScore(address)
        ]);

        // --- Feature Extraction & Normalization ---
        // Transforms MUST match ai/train_real_model.py (the real fraud model).
        // Model input = [txVolume, txFrequency, accountAge, networkDegree,
        //                timeRegularity, valueSentRatio, inOutRatio,
        //                degreeConcentration, valueVolatility]
        const txCount = transactions.length;

        let sentValue = 0, receivedValue = 0, receivedCount = 0, maxValue = 0;
        const partners = new Set();
        let minTs = Date.now(), maxTs = 0;
        transactions.forEach(t => {
            const amount = Number(t.amount) || 0;
            const isOut = (t.type === 'OUT') || (String(t.from || '').toLowerCase() === address.toLowerCase());
            if (isOut) sentValue += amount; else receivedValue += amount;
            if (!isOut) receivedCount++;
            if (amount > maxValue) maxValue = amount;
            const ts = Number(t.timestamp) || 0;
            if (ts < minTs) minTs = ts;
            if (ts > maxTs) maxTs = ts;
            const from = String(t.from || '').toLowerCase();
            const to = String(t.to || '').toLowerCase();
            if (from !== address) partners.add(from);
            if (to !== address) partners.add(to);
        });

        const totalValue = sentValue + receivedValue;
        const avgValue = txCount > 0 ? totalValue / txCount : 0;
        const uniquePartners = partners.size;
        const activeDays = txCount > 0 ? (Date.now() - minTs) / (1000 * 60 * 60 * 24) : 0;
        const avgGapMinutes = txCount > 1 ? (maxTs - minTs) / (txCount - 1) / 60000 : 0;

        const txVolume = Math.tanh(Math.log1p(avgValue) / 3);
        const txFrequency = Math.tanh(txCount / 50);
        const accountAge = Math.tanh(activeDays / 365);
        const networkDegree = Math.tanh(uniquePartners / 20);
        const timeRegularity = Math.tanh(Math.log1p(avgGapMinutes) / 6);
        const valueSentRatio = totalValue > 0 ? sentValue / totalValue : 0.5;
        const inOutRatio = txCount > 0 ? receivedCount / txCount : 0.5;
        const degreeConcentration = txCount > 0 ? uniquePartners / txCount : 0;
        const valueVolatility = Math.tanh(Math.log1p(maxValue) / 3);

        // --- Prediction ---
        let predictedScore = 0.5;

        if (this.model) {
            const features = [txVolume, txFrequency, accountAge, networkDegree,
                              timeRegularity, valueSentRatio, inOutRatio,
                              degreeConcentration, valueVolatility];
            try {
                // Model outputs P(fraud) (sigmoid). Trust = 1 - P(fraud).
                const fraudProb = this.model.predict(features);
                predictedScore = 1 - Math.max(0, Math.min(1, fraudProb));
            } catch (e) {
                console.error(`[AI] Prediction failed for ${address}:`, e.message);
                predictedScore = onChainScore;
            }
        } else {
            predictedScore = onChainScore;
        }
        
        return predictedScore;
    }

    detectTemporalAnomalies(transactions) {
        if (!transactions || transactions.length < 5) return 0;

        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * 60 * 60 * 1000;

        const recentTx = transactions.filter(tx => (now - tx.timestamp) < oneHour);
        if (recentTx.length > 10) return 0.2;

        const pastTx = transactions.filter(tx => (now - tx.timestamp) > oneDay);
        if (pastTx.length > 5) {
            const avgVolume = pastTx.reduce((sum, tx) => sum + tx.amount, 0) / pastTx.length;
            const recentVolume = recentTx.reduce((sum, tx) => sum + tx.amount, 0);
            
            if (recentVolume > (avgVolume * 5) && recentVolume > 10) { 
                return 0.15; 
            }
        }

        return 0;
    }

    async processTransaction(from, to, amount) {
        console.log(`[AI] Processing Transaction: ${amount} from ${from} to ${to}`);
        
        const [senderScore, receiverScore] = await Promise.all([
            web3Service.getDecryptedScore(from),
            web3Service.getDecryptedScore(to)
        ]);

        let senderShift = 0;
        if (receiverScore < 0.4) {
            senderShift = -0.1;
            await persistence.incrementBlockedTransactions();
            console.log(`[AI] Penalty: ${from} interacted with suspicious receiver ${to}`);
        }

        if (amount > 100 && senderScore > 0.7) {
            senderShift += 0.01;
        }

        // On-chain writes are best-effort: never abort local processing if the chain is unreachable.
        try {
            await web3Service.recordTransaction(from, to, amount);
        } catch (e) {
            console.warn(`[AI] On-chain record skipped: ${e.message}`);
        }

        if (senderShift !== 0) {
            try {
                await web3Service.updateScore(from, senderScore + senderShift);
            } catch (e) {
                console.warn(`[AI] On-chain score update skipped: ${e.message}`);
            }
        }

        await this.processEvaluation(from);
        await this.processEvaluation(to);
        return "on-chain";
    }

    async processTransactionComment(from, target, txId, text, rating) {
        console.log(`[AI] Processing Comment from ${from} on ${target} for TX ${txId}: "${text}" (Rating: ${rating})`);
        
        // Fetch current scores from Chain
        const [targetScore, fromScore] = await Promise.all([
             web3Service.getDecryptedScore(target),
             web3Service.getDecryptedScore(from)
        ]);
        
        let sentimentShift = (rating - 3) * 0.05;
        const decryptedReporterScore = await web3Service.getDecryptedScore(from);
        const decryptedTargetScore = await web3Service.getDecryptedScore(target);

        sentimentShift *= decryptedReporterScore; // 0-1 weight

        let newScore = decryptedTargetScore + sentimentShift;
        newScore = Math.max(0, Math.min(1, newScore));
        
        const reportText = JSON.stringify({
            type: 'COMMENT',
            text,
            txId,
            rating
        });

        // Submit to Chain (best-effort, never abort local processing if unreachable)
        try {
            await web3Service.submitReport(target, reportText);
            await web3Service.updateScore(target, newScore);
        } catch (e) {
            console.warn(`[AI] On-chain comment sync skipped: ${e.message}`);
        }
        
        await this.processEvaluation(target);
    }

    async processReport(reporter, target, text) {
        console.log(`[AI] Analyzing Report from ${reporter} against ${target}: "${text}"`);
        
        const isAnonymous = reporter === 'ANONYMOUS';

        const [targetScore, reporterScore] = await Promise.all([
            web3Service.getDecryptedScore(target),
            isAnonymous ? Promise.resolve(0.6) : web3Service.getDecryptedScore(reporter)
        ]);

        const authorities = await persistence.getAuthorities();
        const auth = isAnonymous ? null : authorities.find(a => (a.id || '').toLowerCase() === reporter.toLowerCase());
        
        if (auth && auth.status === 'revoked') {
            console.warn(`[AI] Ignoring report from revoked authority: ${reporter}`);
            return;
        }

        const reporterUser = !isAnonymous ? await persistence.getUser(reporter) : null;
        const isCompany = reporterUser && reporterUser.role === 'company';

        let impactWeight = 0.05; // Default

        if (auth) {
            impactWeight = 0.3;
            console.log(`[AI] Authority Report (Weight: 0.3)`);
        } else if (isCompany) {
            impactWeight = 0.25; // Strong
            console.log(`[AI] Trusted Company Report (Weight: 0.25)`);
        } else if (reporterScore > 0.8) {
            impactWeight = 0.2; // High Rep User
        }
        
        let riskScore = 0;

        // Local ML text risk model (TF-IDF + LR) — replaces the OpenAI call.
        if (this.textClassifierEnabled) {
            const result = this.textClassifier.score(text);
            if (result) {
                riskScore = result.risk;
                console.log(`[AI] ML Text Analysis: Score ${riskScore.toFixed(4)} (${result.knownTokens} known tokens)`);
            } else {
                console.log("[AI] No vocabulary tokens in report text, falling back to heuristics.");
                riskScore = this.calculateHeuristicRisk(text);
            }
        } else {
            riskScore = this.calculateHeuristicRisk(text);
        }

        // HEURISTIC / AI Threshold
        // If analysis says risk > 0.3 OR it's a trusted reporter, we apply penalty
        if (riskScore > 0.3 || auth || isCompany) {
            // Impact Calculation:
            // Base Impact * RiskFactor * (Scaling)
            // If Risk is 1.0 -> Full Impact * 2 (e.g. 0.25 * 2 = 0.5 drop)
            // If Risk is 0.5 -> Impact (0.25 drop)
            const riskFactor = Math.max(0.5, riskScore * 2); 
            
            let newScore = targetScore - (impactWeight * riskFactor);
            newScore = Math.max(0, Math.min(1, newScore));
            
            try {
                await web3Service.submitReport(target, text);
                await web3Service.updateScore(target, newScore);
            } catch (e) {
                console.warn(`[AI] On-chain report sync skipped: ${e.message}`);
            }
            
            if (auth) {
                await persistence.recordAuthorityReport(reporter);
            }
            
            await this.processEvaluation(target);
        }
    }

    calculateHeuristicRisk(text) {
        let flagCount = 0;
        const redFlags = ['scam', 'fraud', 'steal', 'theft', 'fake', 'stolen', 'hack', 'phishing'];
        redFlags.forEach(word => {
            if (text.toLowerCase().includes(word)) flagCount++;
        });
        // Normalize to 0-1 score roughly
        return Math.min(1, flagCount * 0.4); 
    }

    async processEvaluation(address) {
        const score = await this.calculateScore(address);
        
        let category = 'medium';
        if (score <= 0.2) category = 'high';
        else if (score >= 0.8) category = 'low';
        await persistence.incrementEvaluations(category);

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

        const reportText = `Manual ${action}: ${reason}`;

        // Register the override so re-calculation keeps the operator's decision.
        if (action === 'blacklist' || action === 'whitelist') {
            this.manualOverrides.set(address.toLowerCase(), { action, score: newScore, reason, timestamp: Date.now() });
        } else if (action === 'reset') {
            this.manualOverrides.delete(address.toLowerCase());
        }

        await web3Service.submitReport(address, reportText);
        await web3Service.updateScore(address, newScore);

        return await this.processEvaluation(address);
    }
}

export default new AIScoreService();
