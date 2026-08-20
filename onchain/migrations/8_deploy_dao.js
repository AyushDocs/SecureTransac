const TrustDAO = artifacts.require("TrustDAO");
const TrustRegistry = artifacts.require("TrustRegistry");
const AVToken = artifacts.require("AVToken");

module.exports = async function (deployer, network, accounts) {
  // Ensure we have the dependencies
  const token = await AVToken.deployed();
  const registry = await TrustRegistry.deployed();

  console.log("Deploying TrustDAO with Token:", token.address, "Registry:", registry.address);
  
  await deployer.deploy(TrustDAO, token.address, registry.address);
  const dao = await TrustDAO.deployed();
  
  console.log(`TrustDAO deployed at: ${dao.address}`);

  // Transfer Registry verification ownership to DAO so it can execute upgrades
  // Note: This removes ability for deployer to upgrade manually!
  await registry.transferOwnership(dao.address);
  console.log("Transferred TrustRegistry ownership to TrustDAO for decentralized governance.");
};
