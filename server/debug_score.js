require('dotenv').config();
const web3Service = require('./src/services/web3Service');

async function debug() {
    const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    
    try {
        const score = await web3Service.getDecryptedScore(address);
        console.log(`Final Result for ${address}:`, score);
    } catch(e) {
        console.error("Error fetching score:", e.message);
    }
    
    process.exit(0);
}

debug();
