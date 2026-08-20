import 'dotenv/config';
import persistence from '../services/persistenceService.js';
import web3Service from '../services/web3Service.js';
import aiService from '../services/aiService.js';

const ACCOUNTS = {
    deployer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    companyA: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    companyB: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    alice: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    bob: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    eve: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function simulate(live) {
    console.log('⚡ Simulating SecureTransac activity...');
    persistence.register(ACCOUNTS.deployer, 'deployer', { name: 'System Deployer' });
    persistence.register(ACCOUNTS.alice, 'user', { name: 'Alice (Trusted)' });
    persistence.register(ACCOUNTS.bob, 'user', { name: 'Bob (Suspicious)' });
    persistence.register(ACCOUNTS.eve, 'user', { name: 'Eve (Malicious)' });

    const rounds = 3;
    for (let r = 1; r <= rounds; r++) {
        console.log(`\n--- Round ${r}/${rounds} ---`);
        const txs = [
            { from: ACCOUNTS.alice, to: ACCOUNTS.deployer, amount: 25.5 + r * 5 },
            { from: ACCOUNTS.deployer, to: ACCOUNTS.alice, amount: 10 + r },
            { from: ACCOUNTS.alice, to: ACCOUNTS.bob, amount: 2.5 * r },
            { from: ACCOUNTS.companyA, to: ACCOUNTS.deployer, amount: 100 + r * 20 },
            { from: ACCOUNTS.bob, to: ACCOUNTS.eve, amount: 1 + r * 0.5 },
        ];
        for (const t of txs) {
            try {
                const txId = await aiService.processTransaction(t.from, t.to, t.amount);
                console.log(`  ✅ TX  ${t.from.slice(0, 8)}→${t.to.slice(0, 8)}  ${t.amount} AV  id=${txId}`);
            } catch (e) {
                console.log(`  ⚠️  TX  skipped: ${e.message}`);
            }
            if (live) await sleep(1800);
        }

        if (r === 1) {
            try {
                await aiService.processReport(ACCOUNTS.companyA, ACCOUNTS.eve, 'Suspicious high-frequency transfers detected.');
                await aiService.processReport(ACCOUNTS.companyB, ACCOUNTS.bob, 'Unusual interaction with flagged contract.');
                console.log('  ✅ REPORTS submitted against Eve & Bob');
            } catch (e) {
                console.log(`  ⚠️  REPORT skipped: ${e.message}`);
            }
        }
    }

    console.log('\n--- Syncing scores ---');
    for (const addr of Object.values(ACCOUNTS)) {
        try {
            const score = await aiService.calculateScore(addr);
            await web3Service.updateScore(addr, score);
            console.log(`  score ${addr.slice(0, 8)}: ${(Number(score) * 100).toFixed(1)}`);
        } catch (e) {
            console.log(`  ⚠️  score sync skipped: ${e.message}`);
        }
    }

    console.log('✨ Activity simulation complete. Watch the War Room live feed.');
    process.exit(0);
}

const live = process.argv.includes('--live');
simulate(live).catch((err) => {
    console.error(err);
    process.exit(1);
});