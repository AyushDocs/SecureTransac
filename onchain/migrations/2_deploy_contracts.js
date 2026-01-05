const TrustRegistry = artifacts.require("TrustRegistry");
const SecureVault = artifacts.require("SecureVault");
const IdentityVault = artifacts.require("IdentityVault");

module.exports = async function (deployer) {
  await deployer.deploy(TrustRegistry);
  const registry = await TrustRegistry.deployed();
  
  await deployer.deploy(SecureVault, registry.address);
  await deployer.deploy(IdentityVault, registry.address);
};
