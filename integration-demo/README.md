# SecureTransac Soulbound ID: Integration Guide

This directory demonstrates how the **SecureTransac Soulbound Token (SBT)** can be utilized as a "reputation backbone" for other decentralized applications (dApps). 

By integrating with our SBT, developers can implement **Trust-as-a-Service** without building their own kyc or scoring infrastructure.

## 🔑 Key Concepts

1. **Soulbound Verification**: Since the `SecureTransacSBT` is non-transferable and linked to a verified trust score, other contracts can trust it as a "Passport" for the ecosystem.
2. **Reputation Gating**: Access functions can be limited to users with specific levels (e.g. `GOLD`, `PLATINUM`).
3. **Dynamic Logic**: As the user's score changes in the `TrustRegistry`, their `ReputationLevel` on the SBT card updates automatically, allowing real-time benefit adjustments.

## 🛠 Integration Examples

### 1. DeFi Access Control (`GatedDeFiApp.sol`)
Showcases how a lending protocol or liquidity pool can restrict high-value deposits to "Trusted" users only.
* **Logic**: Checks `sbt.getReputationLevel(msg.sender)`.
* **Use Case**: Reducing protocol risk by filtering for users with proven non-malicious history.

### 2. Sybil-Resistant Minting (`TrustGatedNFT.sol`)
Demonstrates an NFT collection or Airdrop that only allows minting for users who have a Soulbound ID.
* **Logic**: Checks `sbt.balanceOf(msg.sender)`.
* **Use Case**: Preventing bot farms from draining an airdrop or minting out a collection.

## 🚀 How to Integrate

To integrate with SecureTransac, simply import the interface in your Solidity contract:

```solidity
interface ISecureTransacSBT {
    function balanceOf(address owner) external view returns (uint256);
    function getReputationLevel(address user) external view returns (string memory);
}
```

Then, initialize the interface with our deployed SBT address:

```solidity
ISecureTransacSBT sbt = ISecureTransacSBT(0xYourSBTAddress);
```

### Deployed Artifacts (Local Demo)
* **TrustRegistry**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
* **SecureTransacSBT**: `0x998abeb3E57409262aE5b751f60747921B33613E`
