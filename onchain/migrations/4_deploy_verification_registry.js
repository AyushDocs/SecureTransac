const VerificationRegistry = artifacts.require("VerificationRegistry");

module.exports = async function (deployer) {
  await deployer.deploy(VerificationRegistry);
  const instance = await VerificationRegistry.deployed();
  const chainId = await web3.eth.net.getId();
  console.log(`VerificationRegistry deployed at: ${instance.address} (Chain ID: ${chainId})`);
};
