const TrustRegistry = artifacts.require("TrustRegistry");
const ZKIdentityVerifier = artifacts.require("ZKIdentityVerifier");
const ZKScoreVerifier = artifacts.require("ZKScoreVerifier");

module.exports = async function (deployer) {
  const registry = await TrustRegistry.deployed();
  
  // Deploy Identity Verifier (Circuit 1)
  await deployer.deploy(ZKIdentityVerifier, registry.address);
  
  // Deploy Score Verifier (Circuit 2 - Generic Groth16)
  await deployer.deploy(ZKScoreVerifier);
  
  const instance = await ZKScoreVerifier.deployed();
  console.log(`Groth16 ZKScoreVerifier deployed at: ${instance.address}`);
};
