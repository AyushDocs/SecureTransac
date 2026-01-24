const fs = require('fs');
const path = require('path');

const TrustRegistry = artifacts.require("TrustRegistry");
const IdentityVault = artifacts.require("IdentityVault");

function getLatestAddress(contractName) {
    const artifactPath = path.join(__dirname, '../build/contracts', `${contractName}.json`);
    if (!fs.existsSync(artifactPath)) {
        throw new Error(`Artifact not found: ${artifactPath}`);
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const networks = artifact.networks;
    const networkIds = Object.keys(networks);
    
    if (networkIds.length === 0) {
        throw new Error(`No deployments found for ${contractName}`);
    }
    
    // Sort numeric sort to be safe
    networkIds.sort((a, b) => Number(a) - Number(b));
    const latestId = networkIds[networkIds.length - 1];
    console.log(`Using latest deployment for ${contractName}: Network ID ${latestId}, Address ${networks[latestId].address}`);
    return networks[latestId].address;
}

module.exports = async function(callback) {
  try {
    const networkId = await web3.eth.net.getId();
    console.log(`Current Network ID from Web3: ${networkId}`);

    const registryAddress = getLatestAddress("TrustRegistry");
    const vaultAddress = getLatestAddress("IdentityVault");

    const registry = await TrustRegistry.at(registryAddress);
    const vault = await IdentityVault.at(vaultAddress);
    
    const accounts = await web3.eth.getAccounts();

    console.log("Seeding data...");

    // Authorized Reporter [1] (e.g. HealthTrust Inc.)
    // Company Dashboard A
    const reporter = accounts[1];
    // Use accounts[0] which is likely the deployer/owner
    await registry.setReporterStatus(reporter, true, { from: accounts[0] });
    console.log(`Reporter authorized: ${reporter}`);

    // Company Dashboard B
    const reporter2 = accounts[2];
    await registry.setReporterStatus(reporter2, true, { from: accounts[0] });
    console.log(`Reporter authorized: ${reporter2}`);

    // User [3] (e.g. Gamy)
    // User Dashboard
    const user = accounts[3];
    await registry.updateScore(user, 850, { from: accounts[0] }); // Initial score
    console.log(`User score updated: ${user}`);
    
    // Create some activity
    await registry.recordTransaction(user, accounts[4], 5000, { from: accounts[0] }); 
    console.log(`Transaction recorded for ${user}`);

    await registry.submitReport(user, "Initial positive assessment", { from: reporter });
    console.log(`Report submitted for ${user}`);

    console.log("Seeding complete!");
    callback();
  } catch (err) {
    console.error("Seeding failed:", err);
    callback(err);
  }
};
