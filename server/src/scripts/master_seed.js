import 'dotenv/config';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import persistence from '../services/persistenceService.js';
import web3Service from '../services/web3Service.js';
import aiService from '../services/aiService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loadArtifact = (name) => JSON.parse(readFileSync(path.join(__dirname, `../../../onchain/build/contracts/${name}.json`), 'utf8'));
const MIN_STAKE = '1000000000000000000000'; // 1000 AV (TrustDAO.MIN_STAKE)

async function onboardReporter(company) {
    const web3 = web3Service.web3;
    const networkId = process.env.NETWORK_ID || '1337';
    const tokenArt = loadArtifact('AVToken');
    const daoArt = loadArtifact('TrustDAO');
    const tokenAddr = tokenArt.networks?.[networkId]?.address || tokenArt.networks?.['1337']?.address;
    const daoAddr = daoArt.networks?.[networkId]?.address || daoArt.networks?.['1337']?.address;
    const token = new web3.eth.Contract(tokenArt.abi, tokenAddr);
    const dao = new web3.eth.Contract(daoArt.abi, daoAddr);
    const admin = web3Service.adminAccount.address;

    console.log(`Minting 1000 AV to reporter ${company}...`);
    await token.methods.mint(company, MIN_STAKE).send({ from: admin });
    console.log(`Approving TrustDAO ${daoAddr}...`);
    await token.methods.approve(daoAddr, MIN_STAKE).send({ from: company });
    console.log(`Staking via TrustDAO (registers as STANDARD reporter)...`);
    await dao.methods.stake().send({ from: company, gas: 500000 });
    console.log(`✅ Reporter on-chain for ${company}`);
}

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
    const networkId = process.env.NETWORK_ID || '1337';

    // 1. Register Users and Authorities in Persistence
    console.log('--- Seeding Persistence ---');
    persistence.register(accounts[0], 'deployer', { name: 'System Deployer' });
    persistence.saveAuthority(accounts[1], { name: 'ChainSafe Audit', email: 'audit@chainsafe.io' });
    persistence.saveAuthority(accounts[2], { name: 'OpenZeppelin Security', email: 'security@openzeppelin.com' });
    
    persistence.register(accounts[3], 'user', { name: 'Alice (Trusted)' });
    persistence.register(accounts[4], 'user', { name: 'Bob (Suspicious)' });
    persistence.register(accounts[5], 'user', { name: 'Eve (Malicious)' });

    // 2. Sync Authorities to Blockchain (via TrustDAO governance stake)
    console.log('--- Syncing Authorities to Blockchain ---');
    for (const auth of [accounts[1], accounts[2]]) {
        try {
            await onboardReporter(auth);
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
        await web3Service.requestVerification(accounts[3], accounts[1], 'ipfs://QmProof123');
    } catch (e) {
        console.error('❌ Verification failure:', e.message);
    }

    // 4. Create DAO Proposals (dummy governance data)
    console.log('--- Creating DAO Proposals ---');
    const daoArt = loadArtifact('TrustDAO');
    const daoAddr = daoArt.networks?.[networkId]?.address;
    const tokenArt = loadArtifact('AVToken');
    const tokenAddr = tokenArt.networks?.[networkId]?.address;
    if (daoAddr && tokenAddr) {
        const dao = new web3Service.web3.eth.Contract(daoArt.abi, daoAddr);
        const token = new web3Service.web3.eth.Contract(tokenArt.abi, tokenAddr);

        // Proposal 1: Active, voting open, no votes yet (will expire in 1 day)
        try {
            await dao.methods.createProposalWithDuration("Increase minimum reporter stake from 1000 to 2000 AV to improve network security", 86400).send({ from: accounts[1], gas: 500000 });
            console.log('  ✅ Proposal 1 created (Active, 1 day voting)');
        } catch (e) { console.error('  ❌ Proposal 1 failed:', e.message); }

        // Proposal 2: Active, has votes from both reporters
        try {
            await dao.methods.createProposalWithDuration("Add Polygon PoS as supported L2 for cross-chain reputation sync", 86400).send({ from: accounts[2], gas: 500000 });
            // Both reporters vote FOR
            await dao.methods.vote(1, true).send({ from: accounts[1], gas: 200000 });
            await dao.methods.vote(1, true).send({ from: accounts[2], gas: 200000 });
            console.log('  ✅ Proposal 2 created + voted (Active, 2 FOR votes)');
        } catch (e) { console.error('  ❌ Proposal 2 failed:', e.message); }

        // Proposal 3: Active, split votes
        try {
            await dao.methods.createProposalWithDuration("Reduce VOTING_PERIOD from 1 day to 6 hours for faster governance", 86400).send({ from: accounts[1], gas: 500000 });
            await dao.methods.vote(2, true).send({ from: accounts[1], gas: 200000 });
            await dao.methods.vote(2, false).send({ from: accounts[2], gas: 200000 });
            console.log('  ✅ Proposal 3 created + split voted (Active, 1 FOR / 1 AGAINST)');
        } catch (e) { console.error('  ❌ Proposal 3 failed:', e.message); }

        // Proposal 4: Short duration (1 minute) — will already be expired for "Pending Execution" state
        try {
            await dao.methods.createProposalWithDuration("Emergency: pause all non-admin transactions for 24 hours", 60).send({ from: accounts[2], gas: 500000 });
            await dao.methods.vote(3, true).send({ from: accounts[1], gas: 200000 });
            await dao.methods.vote(3, true).send({ from: accounts[2], gas: 200000 });
            console.log('  ✅ Proposal 4 created (1 min, expired → Pending Execution, 2 FOR)');
        } catch (e) { console.error('  ❌ Proposal 4 failed:', e.message); }

        // Proposal 5: Already executed
        try {
            await dao.methods.createProposalWithDuration("Approve community grant of 500 AV for security researchers", 60).send({ from: accounts[1], gas: 500000 });
            await dao.methods.vote(4, true).send({ from: accounts[1], gas: 200000 });
            // Execute immediately (1 min duration will expire fast)
            await dao.methods.executeProposal(4).send({ from: accounts[0], gas: 500000 });
            console.log('  ✅ Proposal 5 created + executed (Passed)');
        } catch (e) { console.error('  ❌ Proposal 5 failed:', e.message); }
    }
    
    // 5. Update all scores on-chain
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
