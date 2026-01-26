// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ISecureTransacSBT
 * @dev Interface for the Soulbound identity token to check reputation levels and ownership.
 */
interface ISecureTransacSBT {
    function balanceOf(address owner) external view returns (uint256);
    function getReputationLevel(address user) external view returns (string memory);
}

/**
 * @title GatedDeFiApp
 * @dev Example of a DeFi application that uses Soulbound ID for access control.
 */
contract GatedDeFiApp {
    ISecureTransacSBT public sbt;
    
    // Mapping to track "trusted" deposits
    mapping(address => uint256) public deposits;

    event TrustedDeposit(address indexed user, uint256 amount, string level);

    constructor(address _sbtAddress) {
        sbt = ISecureTransacSBT(_sbtAddress);
    }

    /**
     * @dev Restricted deposit function. 
     * Only users with a Soulbound ID and "GOLD" reputation or higher can deposit.
     */
    function deposit() external payable {
        // 1. Check if user owns the SBT
        require(sbt.balanceOf(msg.sender) > 0, "Access Denied: Soulbound ID required");

        // 2. Check reputation level
        string memory level = sbt.getReputationLevel(msg.sender);
        
        // Logical check for reputation strength
        bool isEligible = (
            keccak256(abi.encodePacked(level)) == keccak256(abi.encodePacked("GOLD")) ||
            keccak256(abi.encodePacked(level)) == keccak256(abi.encodePacked("PLATINUM")) ||
            keccak256(abi.encodePacked(level)) == keccak256(abi.encodePacked("DIAMOND"))
        );

        require(isEligible, "Access Denied: Require GOLD reputation or higher");

        deposits[msg.sender] += msg.value;
        emit TrustedDeposit(msg.sender, msg.value, level);
    }

    /**
     * @dev Example of a function that gives benefits (e.g., lower fees or higher rewards) 
     * based on the level stored in the Soulbound card.
     */
    function calculateRewardBoost(address user) public view returns (uint256) {
        string memory level = sbt.getReputationLevel(user);
        
        if (keccak256(abi.encodePacked(level)) == keccak256(abi.encodePacked("DIAMOND"))) return 20; // 20% boost
        if (keccak256(abi.encodePacked(level)) == keccak256(abi.encodePacked("PLATINUM"))) return 15;
        if (keccak256(abi.encodePacked(level)) == keccak256(abi.encodePacked("GOLD"))) return 10;
        
        return 0;
    }
}
