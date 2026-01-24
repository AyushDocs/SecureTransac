const TrustRegistry = artifacts.require("TrustRegistry");
const IdentityVault = artifacts.require("IdentityVault");

module.exports = async function (deployer) {
  const registry = await TrustRegistry.deployed();
  await deployer.deploy(IdentityVault, registry.address);
  const instance = await IdentityVault.deployed();
  const chainId = await web3.eth.net.getId();
  console.log(`IdentityVault deployed at: ${instance.address} (Chain ID: ${chainId})`);
};
