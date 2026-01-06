const VulnerableBank = artifacts.require("VulnerableBank");
const SecureBank = artifacts.require("SecureBank");

module.exports = async function (deployer) {
  // Configured address from previous deployment
  const REGISTRY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  await deployer.deploy(VulnerableBank);
  await deployer.deploy(SecureBank, REGISTRY_ADDRESS);
};
