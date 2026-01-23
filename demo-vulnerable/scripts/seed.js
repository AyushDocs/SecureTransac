const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => globalThis.fetch(...args));
const API_URL = 'http://127.0.0.1:5000/api/admin';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function seed() {
    const roles = {
        admin: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        user_good: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        user_moderate: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        user_bad: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        company: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        deployer: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'
    };

    console.log('Seeding roles and transaction data...');

    // 1. Seed Company Authority
    console.log('Registering company authority...');
    await fetch(`${API_URL}/authorities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            address: roles.company,
            name: 'HealthTrust Inc.',
            email: 'verify@healthtrust.io',
            level: 'verified_reporter'
        })
    });

    // 2. Simulate some transactions and comments
    console.log('Simulating transactions and user feedback...');
    
    // User Good -> User Moderate
    const res1 = await fetch(`${API_URL}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: roles.user_good, to: roles.user_moderate, amount: 50 })
    });
    const { txId: tx1 } = await res1.json();
    
    await sleep(500);
    
    // User Good comments on User Moderate
    await fetch(`${API_URL}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: roles.user_good,
            target: roles.user_moderate,
            txId: tx1,
            text: 'Very professional and fast transaction!',
            rating: 5
        })
    });

    // User Bad -> User Good (Suspicious)
    const res2 = await fetch(`${API_URL}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: roles.user_bad, to: roles.user_good, amount: 500 })
    });
    const { txId: tx2 } = await res2.json();
    
    await sleep(500);

    // User Good reports User Bad
    await fetch(`${API_URL}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: roles.user_good,
            target: roles.user_bad,
            txId: tx2,
            text: 'Be careful! This user asked for private keys during the chat.',
            rating: 1
        })
    });

    // 3. Admin Overrides
    console.log('Applying admin overrides...');
    await fetch(`${API_URL}/manual-override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            address: roles.user_good,
            action: 'whitelist',
            reason: 'Long term verified participant',
            targetScore: 0.98
        })
    });

    // 4. Company reports User Bad for blacklisting
    console.log('Company reporting user for blacklisting...');
    await fetch(`${API_URL}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reporter: roles.company,
            target: roles.user_bad,
            text: 'Confirmed fraudulent medical record submission.'
        })
    });

    console.log('Seed complete.');
}

seed().catch(console.error);
