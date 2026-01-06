const API_URL = 'http://localhost:5000/api/admin';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function seed() {
    const accounts = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Admin
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // User 1 (Good)
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // User 2 (Good)
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // User 3 (Moderate)
        '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Bad Actor 1
        '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', // Bad Actor 2
        '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720', // New User 4
        '0xBcd4042DE499D14e55001CcbB24a551F3b9493A7', // New User 5
    ];

    console.log('Seeding transactions...');
    
    // Good interactions to increase Active Wallets
    for(let i=1; i<=7; i++) {
        const from = accounts[i % 4 + 1];
        const to = accounts[(i + 1) % 4 + 1];
        console.log(`Interaction ${i}: ${from} -> ${to}`);
        await fetch(`${API_URL}/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to, amount: 2 + i })
        });
        await sleep(500);
    }

    console.log('Reporting bad actors to increase Flagged Addresses...');
    const badActors = [accounts[4], accounts[5]];
    for(const target of badActors) {
        await fetch(`${API_URL}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                reporter: accounts[1], 
                target, 
                text: 'Confirmed malicious activity!' 
            })
        });
        await sleep(500);
    }

    console.log('Simulating suspicious interactions to increase Blocked Transactions...');
    for(let i=0; i<5; i++) {
        await fetch(`${API_URL}/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: accounts[i % 3 + 1], to: accounts[4], amount: 0.1 })
        });
        await sleep(500);
    }

    // Evaluate all accounts to ensure scores and risk distribution are updated
    for(const addr of accounts) {
        await fetch(`${API_URL}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: addr })
        });
        await sleep(500);
    }

    console.log('Seed complete. Metrics should be updated.');

    console.log('Generating realistic Risk Heatmap data...');
    const heatmapData = [
        [0.1, 0.2, 0.15, 0.4, 0.2, 0.1, 0.05], // Row 1: Relatively safe
        [0.2, 0.5, 0.3, 0.1, 0.4, 0.8, 0.2],  // Row 2: One big spike
        [0.1, 0.1, 0.2, 0.1, 0.05, 0.1, 0.1], // Row 3: Very safe
        [0.3, 0.4, 0.6, 0.3, 0.2, 0.1, 0.1]  // Row 4: Moderate activity
    ];
    await fetch(`${API_URL}/risk-heatmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: heatmapData })
    });
    console.log('Risk Heatmap seeded.');

    console.log('Generating Evaluation Velocity data...');
    const velocityData = [
        { label: 'Mon', value: 12400 },
        { label: 'Tue', value: 14200 },
        { label: 'Wed', value: 11800 },
        { label: 'Thu', value: 15600 },
        { label: 'Fri', value: 13900 },
        { label: 'Sat', value: 10200 },
        { label: 'Sun', value: 11400 }
    ];
    await fetch(`${API_URL}/evaluation-velocity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: velocityData })
    });
    console.log('Evaluation Velocity seeded.');
}

seed().catch(console.error);
