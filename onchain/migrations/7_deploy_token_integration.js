const TrustRegistry = artifacts.require("TrustRegistry");
const AVToken = artifacts.require("AVToken");

module.exports = async function (deployer, network, accounts) {
  // 1. Deploy the Token
  await deployer.deploy(AVToken);
  const token = await AVToken.deployed();
  console.log(`AVToken deployed at: ${token.address}`);

  // 2. Link Token to TrustRegistry
  const registry = await TrustRegistry.deployed();
  await registry.setTrustToken(token.address);
  console.log(`Linked Token ${token.address} to Registry ${registry.address}`);
};
