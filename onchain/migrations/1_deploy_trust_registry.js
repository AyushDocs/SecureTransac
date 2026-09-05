const TrustRegistry = artifacts.require("TrustRegistry");
const { poseidonContract } = require("../../zk/node_modules/circomlibjs/build/main.cjs");

module.exports = async function (deployer, network, accounts) {
  const bytecode = poseidonContract.createCode(2);
  const abi = poseidonContract.generateABI(2);

  const PoseidonContract = new web3.eth.Contract(abi);
  const poseidonInstance = await PoseidonContract.deploy({ data: bytecode }).send({
    from: accounts[0],
    gas: 6000000,
  });
  console.log(`PoseidonT3 deployed at: ${poseidonInstance.options.address}`);

  await deployer.deploy(TrustRegistry);
  const registry = await TrustRegistry.deployed();
  console.log(`TrustRegistry deployed at: ${registry.address}`);

  await registry.setPoseidonHash(poseidonInstance.options.address);
  console.log("Linked PoseidonT3 to TrustRegistry");
};
