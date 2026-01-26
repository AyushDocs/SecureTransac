const fs = require('fs');
const path = require('path');

const contracts = [
    'TrustRegistry',
    'IdentityVault',
    'VerificationRegistry',
    'TrustDAO',
    'SecureTransacSBT',
    'TransactionLogger'
];

const buildDir = path.resolve(__dirname, '../../onchain/build/contracts');
const outFile = path.resolve(__dirname, '../../frontend/src/api/deployed_addresses_temp.json');

const addresses = {};

contracts.forEach(name => {
    try {
        const artifact = JSON.parse(fs.readFileSync(path.join(buildDir, `${name}.json`)));
        const networks = Object.keys(artifact.networks);
        if (networks.length > 0) {
            const lastNetwork = networks[networks.length - 1];
            addresses[name] = artifact.networks[lastNetwork].address;
        }
    } catch (e) {}
});

fs.writeFileSync(outFile, JSON.stringify(addresses, null, 2));
console.log("Done");
