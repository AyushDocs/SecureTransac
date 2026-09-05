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

  // Register DAO address with TrustRegistry BEFORE transferring ownership.
  // This allows authorizeTier to work via the dao address check.
  await registry.setDAO(dao.address);
  console.log("Registered DAO address with TrustRegistry");

  // Transfer Registry ownership to DAO so it can execute governance actions
  // via authorizeTier (checks msg.sender == owner() || msg.sender == dao).
  await registry.transferOwnership(dao.address);
  console.log("Transferred TrustRegistry ownership to TrustDAO for decentralized governance.");
};
