const TrustRegistry = artifacts.require("TrustRegistry");
const SecureTransacToken = artifacts.require("SecureTransacToken");

module.exports = async function (deployer, network, accounts) {
  // 1. Deploy the Token
  await deployer.deploy(SecureTransacToken);
  const token = await SecureTransacToken.deployed();
  console.log(`SecureTransacToken deployed at: ${token.address}`);

  // 2. Link Token to TrustRegistry
  const registry = await TrustRegistry.deployed();
  await registry.setTrustToken(token.address);
  console.log(`Linked Token ${token.address} to Registry ${registry.address}`);
};
