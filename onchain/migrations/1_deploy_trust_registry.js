const TrustRegistry = artifacts.require("TrustRegistry");

module.exports = async function (deployer) {
  await deployer.deploy(TrustRegistry);
  const instance = await TrustRegistry.deployed();
  const chainId = await web3.eth.net.getId();
  console.log(`TrustRegistry deployed at: ${instance.address} (Chain ID: ${chainId})`);
};
