const TransactionLogger = artifacts.require("TransactionLogger");
const TrustRegistry = artifacts.require("TrustRegistry");

module.exports = async function(deployer) {
  // If TransactionLogger needs TrustRegistry address, we can pass it, but checking contract:
  // It seems independent or just AccessControl.
  await deployer.deploy(TransactionLogger);
};
