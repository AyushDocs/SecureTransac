const fs = require('fs');
const path = require('path');

const contracts = [
    'TrustRegistry',
    'IdentityVault',
    'VerificationRegistry',
    'TrustDAO',
    'SecureTransacSBT'
];

const buildDir = path.resolve(__dirname, '../../onchain/build/contracts');

console.log("=== Current Contract Addresses ===");
const addresses = {};

contracts.forEach(name => {
    try {
        const artifact = JSON.parse(fs.readFileSync(path.join(buildDir, `${name}.json`)));
        const networks = Object.keys(artifact.networks);
        if (networks.length === 0) {
            console.log(`${name}: Not deployed`);
            return;
        }
        const lastNetwork = networks[networks.length - 1]; // Use latest deployment
        const address = artifact.networks[lastNetwork].address;
        addresses[name] = address;
    } catch (e) {
        console.log(`${name}: Error (${e.message})`);
    }
});
console.log(JSON.stringify(addresses, null, 2));
