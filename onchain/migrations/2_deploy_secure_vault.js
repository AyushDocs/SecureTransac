const TrustRegistry = artifacts.require("TrustRegistry");
const SecureVault = artifacts.require("SecureVault");

module.exports = async function (deployer) {
  const registry = await TrustRegistry.deployed();
  await deployer.deploy(SecureVault, registry.address);
  const instance = await SecureVault.deployed();
  const chainId = await web3.eth.net.getId();
  console.log(`SecureVault deployed at: ${instance.address} (Chain ID: ${chainId})`);
};
