const TrustRegistry = artifacts.require("TrustRegistry");
const SoulBoundToken = artifacts.require("SoulBoundToken");

module.exports = async function (deployer) {
  const registry = await TrustRegistry.deployed();
  await deployer.deploy(SoulBoundToken, registry.address);
  const instance = await SoulBoundToken.deployed();
  console.log(`SoulBoundToken deployed at: ${instance.address}`);
};
