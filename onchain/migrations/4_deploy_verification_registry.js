const VerificationRegistry = artifacts.require("VerificationRegistry");
const TrustRegistry = artifacts.require("TrustRegistry");

module.exports = async function (deployer) {
  const registry = await TrustRegistry.deployed();
  await deployer.deploy(VerificationRegistry, registry.address);
  const instance = await VerificationRegistry.deployed();
  console.log(`VerificationRegistry deployed at: ${instance.address}`);
};
