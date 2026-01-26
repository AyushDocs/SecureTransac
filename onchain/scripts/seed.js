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

module.exports = async function(callback) {
    try {
        console.log("=== Seeding SecureTransac Data (Enhanced) ===");
        
        const trustRegistry = await TrustRegistry.deployed();
        const identityVault = await IdentityVault.deployed();
        const txLogger = await TransactionLogger.deployed();
        // Wrap new contracts in try/catch to genericize script if they aren't deployed
        let trustDAO, verificationRegistry;
        try { trustDAO = await TrustDAO.deployed(); } catch(e) { console.log("TrustDAO not deployed, skipping"); }
        try { verificationRegistry = await VerificationRegistry.deployed(); } catch(e) { console.log("VerificationRegistry not deployed, skipping"); }
        
        const accounts = await web3.eth.getAccounts();
        const admin = accounts[0];
        const userGood = accounts[1];
        const userBad = accounts[2];
        const company = accounts[3];

        console.log(`Admin: ${admin}`);

        // 1. Setup Keys
        console.log("Generating Paillier Keys...");
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
        console.log(`Updated Backend Keys.`);

        // 2. Register Key
        console.log("Registering Public Key...");
        const nHex = toHex(publicKey.n);
        const gHex = toHex(publicKey.g);
        try {
            if (trustRegistry.updatePublicKey) {
                await trustRegistry.updatePublicKey(nHex, gHex, { from: admin });
                console.log("Public Key Registered.");
            }
        } catch(e) { console.error("UpdatePublicKey failed:", e.message); }

        // 3. Register Authority
        console.log("Authorizing Admin...");
        try {
            await trustRegistry.setReporterStatus(admin, true, 3, { from: admin });
            console.log("Admin Authorized.");
        } catch (e) { console.error("Auth Admin failed (ignoring):", e.message); }

        // 4. Seed Identities
        const cids = {
            [userGood]: "QmGoodUserHash1234567890",
            [userBad]: "QmBadUserHash1234567890",
            [company]: "QmCompanyHash1234567890"
        };
        for (const [addr, cid] of Object.entries(cids)) {
            try {
                await identityVault.storeData(cid, { from: addr });
                console.log(`Identity stored for ${addr}`);
            } catch(e) { console.error(`Identity fail for ${addr}:`, e.message); }
        }

        // 5. Encrypted Scores
        console.log("Seeding Scores...");
        const scores = [
            { user: admin, score: 99 },
            { user: userGood, score: 85 },
            { user: userBad, score: 20 },
            { user: company, score: 95 }
        ];

        for (const { user, score } of scores) {
            try {
                const m = BigInt(score);
                // Random factor generated internally if omitted
                const c = publicKey.encrypt(m);
                const cHex = toHex(c);
                await trustRegistry.updateScore(user, cHex, { from: admin });
                console.log(`Score ${score} set for ${user}`);
            } catch(e) { console.error(`Score fail for ${user}:`, e.message); }
        }

        // 6. Transactions
        console.log("Seeding Transactions...");
        try {
            await txLogger.setReporterStatus(admin, true, 3, { from: admin });
        } catch(e) {}

        try {
            await txLogger.recordTransaction(userGood, company, web3.utils.toWei('50', 'ether'), { from: admin });
            console.log("Tx 1 recorded");
        } catch(e) { console.error("Tx 1 fail:", e.message); }

        try {
            await txLogger.recordTransaction(userBad, company, 10, { from: admin });
            console.log("Tx 2 recorded");
        } catch(e) { console.error("Tx 2 fail:", e.message); }

        // 7. DAO Proposals
const SecureTransacToken = artifacts.require("SecureTransacToken"); // Add this require at top if missing, or use deployed() logic

        // ... (inside async function)
        let token;
        try { token = await SecureTransacToken.deployed(); } catch(e) {}

        // 7. DAO Proposals
        if (trustDAO && token) {
            console.log("Seeding DAO...");
            try {
                // 1. Fund User
                const amount = web3.utils.toWei('2000', 'ether');
                await token.transfer(userGood, amount, { from: admin });
                
                // 2. User Approve DAO
                await token.approve(trustDAO.address, amount, { from: userGood });

                // 3. User Stake
                await trustDAO.stake({ from: userGood });
                console.log("User Staked");

                // 4. Create Proposal
                await trustDAO.createProposal("Whitelist Token: USDC", { from: userGood });
                console.log("Proposal 1 Created");
            } catch(e) { console.log("DAO Action failed:", e.message); }
        }

        // 8. Verification & Reporting
        if (verificationRegistry) {
            console.log("Seeding Verifications...");
            try {
                // Register verification (if supported/authorized) - using admin as safety
                await verificationRegistry.registerVerification(userGood, "KYC", "Passport Valid", { from: admin });
                
                // Request Verification (User asks Company)
                await verificationRegistry.requestVerification(userBad, company, "QmProofCid123", { from: userBad });
                console.log("Verification Request Created");
            } catch(e) { console.log("Verification failed:", e.message); }
        }

        console.log("Seeding Reports...");
        try {
             const reportData = JSON.stringify({ type: "FRAUD", text: "Suspected chargeback", severity: 5 });
             await trustRegistry.submitReport(userBad, reportData, { from: company });
             console.log("Report submitted");
        } catch(e) { console.log("Report failed:", e.message); }

        console.log("=== Seed Complete ===");
        callback();
    } catch (e) {
        console.error("FATAL:", e);
        callback(e);
    }
};
