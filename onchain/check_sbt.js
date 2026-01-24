const SecureTransacSBT = artifacts.require("SecureTransacSBT");

module.exports = async function(callback) {
  try {
    // Get deployed contract
    const sbt = await SecureTransacSBT.deployed();
    
    // Get all accounts to find the specific one
    const accounts = await web3.eth.getAccounts();
    const target = accounts.find(a => a.toLowerCase().startsWith("0x7099")) || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    
    console.log(`Checking SBT status for: ${target}`);
    
    try {
        const balance = await sbt.balanceOf(target);
        console.log(`\n-------------------------------------------`);
        console.log(`Account: ${target}`);
        console.log(`SBT Balance: ${balance.toString()}`);
        console.log(`Has Soulbound ID: ${balance > 0 ? "YES ✅" : "NO ❌"}`);
        console.log(`-------------------------------------------\n`);
    } catch (e) {
        console.log(`Error fetching balance. Is the contract deployed?`);
        console.error(e.message);
    }
    
    callback();
  } catch (e) {
    console.error(e);
    callback(e);
  }
};
