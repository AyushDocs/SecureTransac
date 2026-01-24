const fs = require('fs');
const networkId = '1337';
try {
  const TR = JSON.parse(fs.readFileSync('./build/contracts/TrustRegistry.json', 'utf8'));
  const IV = JSON.parse(fs.readFileSync('./build/contracts/IdentityVault.json', 'utf8'));
  const SBT = JSON.parse(fs.readFileSync('./build/contracts/SecureTransacSBT.json', 'utf8'));
  console.log(`TR=${TR.networks[networkId]?.address}`);
  console.log(`IV=${IV.networks[networkId]?.address}`);
  console.log(`SBT=${SBT.networks[networkId]?.address}`);
} catch(e) { console.error(e); }
