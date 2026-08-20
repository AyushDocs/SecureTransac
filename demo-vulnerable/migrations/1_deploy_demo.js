const VulnerableBank = artifacts.require("VulnerableBank");
const UnprotectedStorage = artifacts.require("UnprotectedStorage");

module.exports = async function (deployer, network, accounts) {
  // 0x7099...79c8 is typically account[1] in hardhat/ganache default mnemonic
  const deployerAddress = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
  
  // Verify if account is available in the provider's unlocked accounts
  const fromAccount = accounts.find(a => a.toLowerCase() === deployerAddress.toLowerCase()) || accounts[1];
  
  console.log(`Deploying Vulnerable Contracts from: ${fromAccount}`);

  await deployer.deploy(VulnerableBank, { from: fromAccount });
  await deployer.deploy(UnprotectedStorage, { from: fromAccount });
};
