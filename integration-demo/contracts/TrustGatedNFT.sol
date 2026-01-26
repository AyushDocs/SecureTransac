// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

interface ISecureTransacSBT {
    function balanceOf(address owner) external view returns (uint256);
}

/**
 * @title TrustGatedNFT
 * @dev An NFT contract where minting is restricted to users who have verified their identity via SecureTransac.
 * This prevents bots and Sybil attacks without requiring a central whitelist.
 */
contract TrustGatedNFT is ERC721 {
    ISecureTransacSBT public sbt;
    uint256 public nextTokenId;

    constructor(address _sbtAddress) ERC721("Reputation Rewards NFT", "RRNFT") {
        sbt = ISecureTransacSBT(_sbtAddress);
    }

    /**
     * @dev Mint function gated by Soulbound ID ownership.
     */
    function mint() external {
        // Verification happens by simply checking if the user has the SBT card
        require(sbt.balanceOf(msg.sender) > 0, "Minting restricted to verified SecureTransac users");
        
        _safeMint(msg.sender, nextTokenId);
        nextTokenId++;
    }
}
