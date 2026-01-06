const fs = require('fs');
const path = require('path');

const contracts = ['VulnerableBank', 'SecureBank'];
contracts.forEach(name => {
    const filePath = path.join(__dirname, 'demo-vulnerable/build/contracts', `${name}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const networks = data.networks;
    const lastNetwork = Object.keys(networks).sort().pop();
    console.log(`${name}: ${networks[lastNetwork].address}`);
});
