const TrustRegistry = artifacts.require("TrustRegistry");
const SecureVault = artifacts.require("SecureVault");
const IdentityVault = artifacts.require("IdentityVault");
const VerificationRegistry = artifacts.require("VerificationRegistry");
const ZKIdentityVerifier = artifacts.require("ZKIdentityVerifier");

module.exports = async function (deployer) {
  await deployer.deploy(TrustRegistry);
  const registry = await TrustRegistry.deployed();
  
  await deployer.deploy(SecureVault, registry.address);
  await deployer.deploy(IdentityVault, registry.address);
  await deployer.deploy(VerificationRegistry);
  await deployer.deploy(ZKIdentityVerifier, registry.address);
};
