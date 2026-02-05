import fs from 'fs';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import SimpleNeuralNetwork from '../utils/SimpleNeuralNetwork.js';
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

        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            console.log("[AI] OpenAI Integration Enabled");
        } else {
            console.warn("[AI] OPENAI_API_KEY missing. Using heuristic mode for text analysis.");
        }
    }

    async calculateScore(address) {
        const [transactions, reports, onChainScore] = await Promise.all([
            web3Service.getTransactionHistory(address),
            web3Service.getReports(address),
            web3Service.getScore(address)
        ]);
        
        // --- Feature Extraction & Normalization ---
        
        // 1. TxVolume (Normalized 0-1)
        let avgAmount = 0;
        if (transactions.length > 0) {
            avgAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0) / transactions.length;
        }
        const txVolume = Math.tanh(avgAmount / 100); 

        // 2. TxFrequency (0-1)
        const txFrequency = Math.tanh(transactions.length / 50);

        // 3. AccountAge (0-1)
        let accountAge = 0;
        if (transactions.length > 0) {
            const firstTxTime = transactions.reduce((min, t) => Math.min(min, t.timestamp), Date.now());
            const daysActive = (Date.now() - firstTxTime) / (1000 * 60 * 60 * 24);
            accountAge = Math.tanh(daysActive / 365);
        }

        // 4. ReportCount (0 or 1)
        const reportCount = reports.length > 0 ? 1.0 : 0.0;

        // 5. SocialScore (0-1)
        const socialRiskModifier = await this.calculateSocialGraphRisk(address, transactions);
        let socialScore = 0.8 + socialRiskModifier;
        socialScore = Math.max(0, Math.min(1, socialScore));

        // --- Prediction ---
        let predictedScore = 0.5;

        if (this.model) {
            const features = [txVolume, txFrequency, accountAge, reportCount, socialScore];
            try {
                predictedScore = this.model.predict(features);
                predictedScore = Math.max(0, Math.min(1, predictedScore));
            } catch (e) {
                console.error(`[AI] Prediction failed for ${address}:`, e.message);
                predictedScore = (Number(onChainScore) / 100);
            }
        } else {
             predictedScore = (Number(onChainScore) / 100) + socialRiskModifier;
        }
        
        return predictedScore;
    }

    async calculateSocialGraphRisk(targetAddress, transactions) {
        if (!transactions || transactions.length === 0) return 0;

        const partners = new Set();
        transactions.slice(0, 10).forEach(tx => {
            if (tx.from.toLowerCase() !== targetAddress.toLowerCase()) partners.add(tx.from);
            if (tx.to.toLowerCase() !== targetAddress.toLowerCase()) partners.add(tx.to);
        });

        if (partners.size === 0) return 0;

        const scores = await Promise.all(Array.from(partners).map(addr => web3Service.getScore(addr)));
        
        const totalPartnerScore = scores.reduce((sum, s) => sum + Number(s), 0);
        const avgPartnerScore = totalPartnerScore / partners.size;

        let riskModifier = 0;

        if (avgPartnerScore < 30) riskModifier -= 0.15;
        else if (avgPartnerScore > 80) riskModifier += 0.05;

        const hasBadActorContact = scores.some(s => Number(s) <= 20);
        if (hasBadActorContact) riskModifier -= 0.1;

        return riskModifier;
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
            web3Service.getScore(from),
            web3Service.getScore(to)
        ]);

        let senderShift = 0;
        if (Number(receiverScore) < 40) {
            senderShift = -0.1;
            await persistence.incrementBlockedTransactions();
            console.log(`[AI] Penalty: ${from} interacted with suspicious receiver ${to}`);
        }

        if (amount > 100 && Number(senderScore) > 70) {
            senderShift += 0.01;
        }

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
        
        // Fetch current scores from Chain
        const [targetScore, fromScore] = await Promise.all([
             web3Service.getScore(target),
             web3Service.getScore(from)
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

        // Submit to Chain
        await web3Service.submitReport(target, reportText);
        await web3Service.updateScore(target, newScore);
        
        await this.processEvaluation(target);
    }

    async processReport(reporter, target, text) {
        console.log(`[AI] Analyzing Report from ${reporter} against ${target}: "${text}"`);
        
        const isAnonymous = reporter === 'ANONYMOUS';

        const [targetScore, reporterScore] = await Promise.all([
            web3Service.getScore(target),
            isAnonymous ? Promise.resolve(60) : web3Service.getScore(reporter)
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
        } else if (Number(reporterScore) > 80) {
            impactWeight = 0.2; // High Rep User
        }
        
        let riskScore = 0;
        let analysisSource = "heuristic";

        if (this.openai) {
            try {
                const completion = await this.openai.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are a fraud detection AI. Analyze the transaction report. Return JSON with 'riskScore' (0.0 to 1.0, where 1.0 is definite fraud) and 'category' (scam, dispute, spam, safe)." },
                        { role: "user", content: text }
                    ],
                    model: "gpt-4o-mini",
                    response_format: { type: "json_object" }
                });
                const result = JSON.parse(completion.choices[0].message.content);
                riskScore = result.riskScore || 0;
                analysisSource = "openai";
                console.log(`[AI] OpenAI Analysis: Score ${riskScore} (${result.category})`);
            } catch (e) {
                console.error("[AI] OpenAI API Failed, falling back to heuristics:", e.message);
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
            
            let newScore = (Number(targetScore) / 100) - (impactWeight * riskFactor);
            newScore = Math.max(0, Math.min(1, newScore));
            
            await web3Service.submitReport(target, text);
            await web3Service.updateScore(target, newScore);
            
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
        
        await web3Service.submitReport(address, reportText);
        await web3Service.updateScore(address, newScore);
        
        return await this.processEvaluation(address);
    }
}

export default new AIScoreService();
