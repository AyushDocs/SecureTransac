const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function seedAuthorities() {
    const API_URL = 'http://localhost:5000/api/admin';
    const authorities = [
        {
            address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            name: 'SecureTransac (Admin)',
            email: 'governance@securetransac.io'
        },
        {
            address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            name: 'ChainSafe Security',
            email: 'audit@chainsafe.io'
        }
    ];

    for (const auth of authorities) {
        console.log(`Seeding authority: ${auth.name}`);
        await fetch(`${API_URL}/authorities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(auth)
        });
    }
    console.log('Seeding complete.');
}

seedAuthorities();
