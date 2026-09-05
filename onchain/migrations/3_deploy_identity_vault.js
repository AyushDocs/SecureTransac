const TrustRegistry = artifacts.require("TrustRegistry");
const SecureDocumentStorage = artifacts.require("SecureDocumentStorage");

module.exports = async function (deployer) {
  const registry = await TrustRegistry.deployed();
  await deployer.deploy(SecureDocumentStorage, registry.address);
  const instance = await SecureDocumentStorage.deployed();
  const chainId = await web3.eth.net.getId();
  console.log(`SecureDocumentStorage deployed at: ${instance.address} (Chain ID: ${chainId})`);
};
