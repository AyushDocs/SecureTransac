const TrustRegistry = artifacts.require("TrustRegistry");
const IdentityVault = artifacts.require("IdentityVault");
const TransactionLogger = artifacts.require("TransactionLogger");
const TrustDAO = artifacts.require("TrustDAO");
const VerificationRegistry = artifacts.require("VerificationRegistry");
const paillier = require('paillier-bigint');
const fs = require('fs');
const path = require('path');

function toHex(bigintVal) {
    let str = bigintVal.toString(16);
    if (str.length % 2 !== 0) str = '0' + str;
    return '0x' + str;
}

// Helper to simulate time delays
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = async function(callback) {
    try {
        console.log("=== Seeding SecureTransac with Rich Transaction History ===");
        
        const trustRegistry = await TrustRegistry.deployed();
        const identityVault = await IdentityVault.deployed();
        const txLogger = await TransactionLogger.deployed();
        
        let trustDAO, verificationRegistry, token;
        try { trustDAO = await TrustDAO.deployed(); } catch(e) { console.log("TrustDAO not deployed"); }
        try { verificationRegistry = await VerificationRegistry.deployed(); } catch(e) { console.log("VerificationRegistry not deployed"); }
        try { 
            const AVToken = artifacts.require("AVToken");
            token = await AVToken.deployed(); 
        } catch(e) { console.log("Token not deployed"); }
        
        const accounts = await web3.eth.getAccounts();
        
        // PRIMARY USER - Your main account
        const PRIMARY_USER = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
        
        // Other test accounts
        const admin = accounts[0];
        const merchant1 = accounts[1];
        const merchant2 = accounts[2];
        const company = accounts[3];
        const friend1 = accounts[4];
        const friend2 = accounts[5];
        const scammer = accounts[6];
        const exchange = accounts[7];

        console.log(`Primary User: ${PRIMARY_USER}`);
        console.log(`Admin: ${admin}`);

        // ============================================
        // 1. Setup Encryption Keys
        // ============================================
        console.log("\n[1/8] Generating Paillier Keys...");
        const { publicKey, privateKey } = await paillier.generateRandomKeys(512);

        const keyData = {
            public: {
                n: publicKey.n.toString(),
                g: publicKey.g.toString()
            },
            private: {
                lambda: (privateKey.lambda || 0n).toString(),
                mu: (privateKey.mu || 0n).toString(),
                p: (privateKey.p || privateKey._p || 0n).toString(),
                q: (privateKey.q || privateKey._q || 0n).toString()
            }
        };

        const serverKeyPath = path.resolve(__dirname, '../../server/paillier_keys.json');
        fs.writeFileSync(serverKeyPath, JSON.stringify(keyData, null, 2));
        console.log("✓ Encryption keys saved");

        // Register public key
        const nHex = toHex(publicKey.n);
        const gHex = toHex(publicKey.g);
        try {
            if (trustRegistry.updatePublicKey) {
                await trustRegistry.updatePublicKey(nHex, gHex, { from: admin });
                console.log("✓ Public key registered on-chain");
            }
        } catch(e) { console.error("Key registration failed:", e.message); }

        // ============================================
        // 2. Authorize Admin as Reporter
        // ============================================
        console.log("\n[2/8] Setting up authorities...");
        try {
            await trustRegistry.setReporterStatus(admin, true, 3, { from: admin });
            await txLogger.setReporterStatus(admin, true, 3, { from: admin });
            console.log("✓ Admin authorized");
        } catch (e) { console.error("Auth setup failed:", e.message); }

        // ============================================
        // 3. Seed Identity Data
        // ============================================
        console.log("\n[3/8] Storing identity metadata...");
        const identities = {
            [PRIMARY_USER]: "QmPrimaryUserIdentity123",
            [merchant1]: "QmMerchant1Identity456",
            [merchant2]: "QmMerchant2Identity789",
            [company]: "QmCompanyIdentityABC",
            [friend1]: "QmFriend1IdentityDEF",
            [friend2]: "QmFriend2IdentityGHI",
            [scammer]: "QmScammerIdentityXYZ",
            [exchange]: "QmExchangeIdentity000"
        };

        for (const [addr, cid] of Object.entries(identities)) {
            try {
                await identityVault.storeData(cid, { from: addr });
                console.log(`✓ Identity stored for ${addr.slice(0, 10)}...`);
            } catch(e) { 
                console.log(`  Skipped ${addr.slice(0, 10)}... (already exists or error)`);
            }
        }

        // ============================================
        // 4. Set Initial Trust Scores
        // ============================================
        console.log("\n[4/8] Setting initial trust scores...");
        const scores = [
            { user: PRIMARY_USER, score: 75, label: "Primary User" },
            { user: admin, score: 99, label: "Admin" },
            { user: merchant1, score: 88, label: "Merchant 1" },
            { user: merchant2, score: 82, label: "Merchant 2" },
            { user: company, score: 95, label: "Company" },
            { user: friend1, score: 70, label: "Friend 1" },
            { user: friend2, score: 68, label: "Friend 2" },
            { user: scammer, score: 15, label: "Scammer" },
            { user: exchange, score: 92, label: "Exchange" }
        ];

        for (const { user, score, label } of scores) {
            try {
                const m = BigInt(score);
                const c = publicKey.encrypt(m);
                const cHex = toHex(c);
                await trustRegistry.updateScore(user, cHex, { from: admin });
                console.log(`✓ ${label}: ${score}/100`);
            } catch(e) { console.error(`Score failed for ${label}:`, e.message); }
        }

        // ============================================
        // 5. Generate Rich Transaction History
        // ============================================
        console.log("\n[5/8] Creating transaction history...");
        console.log("Simulating 30+ transactions over time...");

        const transactions = [
            // Week 1 - Initial activity
            { from: PRIMARY_USER, to: merchant1, amount: '0.5', delay: 100 },
            { from: PRIMARY_USER, to: merchant2, amount: '1.2', delay: 100 },
            { from: friend1, to: PRIMARY_USER, amount: '0.8', delay: 100 },
            
            // Week 2 - More exchanges
            { from: PRIMARY_USER, to: exchange, amount: '5.0', delay: 100 },
            { from: exchange, to: PRIMARY_USER, amount: '4.95', delay: 100 },
            { from: PRIMARY_USER, to: friend2, amount: '0.3', delay: 100 },
            
            // Week 3 - Business transactions
            { from: PRIMARY_USER, to: company, amount: '2.5', delay: 100 },
            { from: company, to: PRIMARY_USER, amount: '3.0', delay: 100 },
            { from: PRIMARY_USER, to: merchant1, amount: '0.7', delay: 100 },
            
            // Week 4 - Peer transfers
            { from: friend1, to: PRIMARY_USER, amount: '1.5', delay: 100 },
            { from: PRIMARY_USER, to: friend1, amount: '1.0', delay: 100 },
            { from: PRIMARY_USER, to: friend2, amount: '0.5', delay: 100 },
            
            // Month 2 - Increased activity
            { from: PRIMARY_USER, to: merchant2, amount: '3.2', delay: 100 },
            { from: merchant2, to: PRIMARY_USER, amount: '0.1', delay: 100 },
            { from: PRIMARY_USER, to: exchange, amount: '10.0', delay: 100 },
            { from: exchange, to: PRIMARY_USER, amount: '9.8', delay: 100 },
            
            // Suspicious activity (scammer)
            { from: scammer, to: PRIMARY_USER, amount: '0.01', delay: 100 },
            { from: PRIMARY_USER, to: scammer, amount: '0.001', delay: 100 },
            
            // Recent activity
            { from: PRIMARY_USER, to: merchant1, amount: '1.8', delay: 100 },
            { from: PRIMARY_USER, to: company, amount: '5.0', delay: 100 },
            { from: company, to: PRIMARY_USER, amount: '5.5', delay: 100 },
            { from: friend2, to: PRIMARY_USER, amount: '2.0', delay: 100 },
            { from: PRIMARY_USER, to: friend2, amount: '2.2', delay: 100 },
            
            // Latest transactions
            { from: PRIMARY_USER, to: exchange, amount: '15.0', delay: 100 },
            { from: exchange, to: PRIMARY_USER, amount: '14.7', delay: 100 },
            { from: PRIMARY_USER, to: merchant1, amount: '0.9', delay: 100 },
            { from: PRIMARY_USER, to: merchant2, amount: '1.1', delay: 100 },
            { from: merchant1, to: PRIMARY_USER, amount: '0.05', delay: 100 },
            { from: PRIMARY_USER, to: friend1, amount: '3.0', delay: 100 },
            { from: PRIMARY_USER, to: company, amount: '7.5', delay: 100 },
            { from: company, to: PRIMARY_USER, amount: '8.0', delay: 100 }
        ];

        let txCount = 0;
        for (const tx of transactions) {
            try {
                const amountWei = web3.utils.toWei(tx.amount, 'ether');
                await txLogger.recordTransaction(tx.from, tx.to, amountWei, { from: admin });
                txCount++;
                if (txCount % 5 === 0) {
                    console.log(`  ${txCount}/${transactions.length} transactions recorded...`);
                }
                await sleep(tx.delay);
            } catch(e) { 
                console.error(`  Failed: ${tx.from.slice(0, 8)} → ${tx.to.slice(0, 8)}`);
            }
        }
        console.log(`✓ ${txCount} transactions recorded`);

        // ============================================
        // 6. Create Reports and Feedback
        // ============================================
        console.log("\n[6/8] Adding reports and feedback...");
        
        try {
            const report1 = JSON.stringify({ 
                type: "FRAUD", 
                text: "Attempted phishing attack", 
                severity: 9 
            });
            await trustRegistry.submitReport(scammer, report1, { from: PRIMARY_USER });
            console.log("✓ Fraud report submitted against scammer");
        } catch(e) { console.log("  Report 1 failed:", e.message); }

        try {
            const report2 = JSON.stringify({ 
                type: "POSITIVE", 
                text: "Excellent service, fast delivery", 
                severity: 1 
            });
            await trustRegistry.submitReport(merchant1, report2, { from: PRIMARY_USER });
            console.log("✓ Positive feedback for merchant1");
        } catch(e) { console.log("  Report 2 failed:", e.message); }

        // ============================================
        // 7. DAO Activity
        // ============================================
        if (trustDAO && token) {
            console.log("\n[7/8] Setting up DAO participation...");
            try {
                const amount = web3.utils.toWei('5000', 'ether');
                await token.transfer(PRIMARY_USER, amount, { from: admin });
                console.log("✓ Tokens transferred to primary user");
                
                // Note: User needs to approve and stake manually from frontend
                console.log("  (User can stake from DAO dashboard)");
            } catch(e) { console.log("  DAO setup failed:", e.message); }
        }

        // ============================================
        // 8. Verification Requests
        // ============================================
        if (verificationRegistry) {
            console.log("\n[8/8] Creating verification requests...");
            try {
                await verificationRegistry.requestVerification(
                    PRIMARY_USER, 
                    company, 
                    "QmKYCProofDocument123", 
                    { from: PRIMARY_USER }
                );
                console.log("✓ KYC verification requested");
            } catch(e) { console.log("  Verification request failed:", e.message); }
        }

        console.log("\n" + "=".repeat(60));
        console.log("✓ SEED COMPLETE - Rich transaction history created!");
        console.log("=".repeat(60));
        console.log(`\nPrimary Account: ${PRIMARY_USER}`);
        console.log(`Total Transactions: ${txCount}`);
        console.log(`Trust Score: 75/100`);
        console.log(`\nRefresh your dashboard to see the data!`);
        console.log("=".repeat(60) + "\n");
        
        callback();
    } catch (e) {
        console.error("\n❌ FATAL ERROR:", e);
        callback(e);
    }
};
