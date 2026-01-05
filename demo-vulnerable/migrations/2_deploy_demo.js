const VulnerableBank = artifacts.require("VulnerableBank");
const SecureBank = artifacts.require("SecureBank");
const TrustRegistry = artifacts.require("TrustRegistry");

module.exports = async function (deployer) {
  // Use the existing registry if it exists, or deploy a new one for the demo
  await deployer.deploy(TrustRegistry);
  const registry = await TrustRegistry.deployed();

  await deployer.deploy(VulnerableBank);
  await deployer.deploy(SecureBank, registry.address);
};
