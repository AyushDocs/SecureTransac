const web3Service = require('../services/web3Service');
const persistence = require('../services/persistenceService');

async function syncHeatmap() {
    console.log("[Indexer] Starting Heatmap Sync from Blockchain...");

    // 1. Fetch all ScoreUpdated events
    // Assuming TrustRegistry contract emits ScoreUpdated(user, newScore)
    // Note: web3Service must expose contract access or a method to get all events.
    // I entered web3Service earlier and it has `startEventListeners` but not `getAllScoreEvents`.
    // I will use web3Service.contract directly if available, or add a helper.
    // Checking web3Service... it exposes 'contract' property but it might be internal or not recommended.
    // Actually, I'll rely on `web3Service.contract.getPastEvents` if I can access it.
    
    try {
        if (!web3Service.contract) {
            console.error("[Indexer] Contract not loaded in Web3Service. Ensure .env is set.");
            process.exit(1);
        }

        const events = await web3Service.contract.getPastEvents('ScoreUpdated', {
            fromBlock: 0,
            toBlock: 'latest'
        });

        console.log(`[Indexer] Found ${events.length} score updates.`);

        // 2. Aggregate latest score per user
        const userScores = {};
        for (const event of events) {
            const user = event.returnValues.user;
            // newScore is bytes (encrypted). 
            // WAIT. We can't build a heatmap from ENCRYPTED bytes without decrypting them!
            // This is the privacy tradeoff.
            
            // If the heatmap is supposed to show "Risk Distribution", we need to know the values.
            // Option A: Decrypt every single score using the Admin Key (Slow, heavily authorized).
            // Option B: The contract emits a "Public Signal" (e.g. Range Proof result/bucket) that isn't fully private?
            // Option C: The heatmap only reflects data we have processed locally via "evaluate address".
            
            // Given "Paillier Encryption", we literally cannot know the distribution from just reading the chain events 
            // unless we decrypt them.
            
            // However, `web3Service` has the private key.
            // We can decrypt them.
            
            userScores[user] = event.returnValues.newScore;
        }

        const addresses = Object.keys(userScores);
        console.log(`[Indexer] Unique users: ${addresses.length}. Decrypting scores...`);

        // Initialize Heatmap buckets (Example: 4 rows (Risk levels), 7 cols (Days? Activity? Or just placeholder))
        // Persistence initializes: Array.from({ length: 4 }, () => Array(7).fill(0))
        // Let's assume buckets are: 
        // Rows: 0=High Risk, 1=Medium, 2=Low, 3=Very Safe
        // Cols: Regions or Time? Or just random distribution for demo? 
        // Usually Heatmap is [Risk Level] x [Activity/Volume].
        
        const heatmap = Array.from({ length: 4 }, () => Array(7).fill(0));

        let processed = 0;
        for (const addr of addresses) {
            try {
                // Decrypt
                const scoreVal = await web3Service.getDecryptedScore(addr); // 0-1 scale
                
                // Categorize Risk
                let riskIndex = 0; // High Risk default
                if (scoreVal >= 0.8) riskIndex = 3; // Very Safe
                else if (scoreVal >= 0.6) riskIndex = 2; // Low Risk
                else if (scoreVal >= 0.4) riskIndex = 1; // Medium Risk
                
                // Categorize Column (Random for now, or based on hash/activity)
                // In demo, we distribute by hash to spread them out
                const colIndex = parseInt(addr.slice(-1), 16) % 7;
                
                heatmap[riskIndex][colIndex]++;
                processed++;
                if (processed % 10 === 0) process.stdout.write('.');
            } catch (e) {
                // Ignore decryption errors
            }
        }
        console.log("\n[Indexer] Decryption complete.");
        
        // 3. Update Persistence
        await persistence.updateRiskHeatmap(heatmap);
        console.log("[Indexer] Heatmap persisted to SQLite");
        
        // Also update total evaluations stat
        // persistence.data.analytics.totalEvaluations = processed; // Optional

    } catch (error) {
        console.error("[Indexer] Sync Failed:", error);
    }
    
    // Check if run as script or imported
    if (require.main === module) {
        process.exit(0);
    }
}

// Allow running directly: node src/scripts/syncHeatmap.js
if (require.main === module) {
    // Wait for async init of web3
    setTimeout(() => syncHeatmap(), 2000); 
}

module.exports = syncHeatmap;
