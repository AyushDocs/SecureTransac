require('dotenv').config();
const persistence = require('../services/persistenceService');
const web3Service = require('../services/web3Service');
const aiService = require('../services/aiService');

const accounts = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Admin/Deployer
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Company 1
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Company 2
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // User 1 (Good)
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // User 2 (Suspicious)
    '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', // User 3 (Malicious)
];

async function seed() {
    console.log('🚀 Starting Master Seed...');

    // 1. Register Users and Authorities in Persistence
    console.log('--- Seeding Persistence ---');
    persistence.register(accounts[0], 'deployer', { name: 'System Deployer' });
    persistence.saveAuthority(accounts[1], { name: 'ChainSafe Audit', email: 'audit@chainsafe.io' });
    persistence.saveAuthority(accounts[2], { name: 'OpenZeppelin Security', email: 'security@openzeppelin.com' });
    
    persistence.register(accounts[3], 'user', { name: 'Alice (Trusted)' });
    persistence.register(accounts[4], 'user', { name: 'Bob (Suspicious)' });
    persistence.register(accounts[5], 'user', { name: 'Eve (Malicious)' });

    // 2. Sync Authorities to Blockchain
    console.log('--- Syncing Authorities to Blockchain ---');
    for (const auth of [accounts[1], accounts[2]]) {
        console.log(`Setting reporter status for ${auth}...`);
        try {
            await web3Service.setReporterStatus(auth, true);
            console.log(`✅ Success for ${auth}`);
        } catch (e) {
            console.error(`❌ Failed for ${auth}: ${e.message}`);
        }
    }

    // 3. Generate interactions and update scores
    console.log('--- Generating ON-CHAIN interactions ---');
    
    // Alice performs transactions
    try {
        console.log('Alice performing transactions...');
        await aiService.processTransaction(accounts[3], accounts[0], 10);
        await aiService.processTransaction(accounts[0], accounts[3], 5);
    } catch (e) {
        console.error('❌ Transaction failure:', e.message);
    }
    
    // Eve gets reported
    try {
        console.log('Reporting Eve...');
        await aiService.processReport(accounts[1], accounts[5], 'Confirmed phishing attempt.');
        await aiService.processReport(accounts[2], accounts[5], 'Malicious contract interaction detected.');
    } catch (e) {
        console.error('❌ Report failure:', e.message);
    }

    // Verifications
    try {
        console.log('Requesting verifications...');
        await web3Service.requestVerification(accounts[1], 'ipfs://QmProof123');
    } catch (e) {
        console.error('❌ Verification failure:', e.message);
    }
    
    // 4. Update all scores on-chain
    console.log('--- Final Score Sync ---');
    for (const addr of accounts) {
        try {
            const score = await aiService.calculateScore(addr);
            console.log(`Syncing score for ${addr}: ${score}`);
            await web3Service.updateScore(addr, score);
        } catch (e) {
            console.error(`❌ Sync failed for ${addr}: ${e.message}`);
        }
    }

    console.log('✨ Pure On-Chain Master Seed Complete!');
}

seed().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
