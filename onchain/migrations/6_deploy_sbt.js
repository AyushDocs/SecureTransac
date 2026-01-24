const TrustRegistry = artifacts.require("TrustRegistry");
const SecureTransacSBT = artifacts.require("SecureTransacSBT");

module.exports = async function (deployer) {
  const registry = await TrustRegistry.deployed();
  await deployer.deploy(SecureTransacSBT, registry.address);
  const instance = await SecureTransacSBT.deployed();
  console.log(`SecureTransacSBT deployed at: ${instance.address}`);
};
