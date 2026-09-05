// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ScoringSystem.sol";
import "./TransactionLogger.sol";
import "./ReportingSystem.sol";

/**
 * @title TrustRegistry
 * @dev Aggregator contract inheriting split functionality.
 * Kept for backward compatibility with existing deployment scripts and frontend.
 * Ideally, frontend would interact with specific contracts, but this wrapper simplifies migration.
 */
contract TrustRegistry is ScoringSystem, TransactionLogger, ReportingSystem {
    event TierUpgraded(address indexed user, Role tier, uint256 stakedAmount);

    address public dao;

    constructor() SecureAccessControl() {
    }

    function setDAO(address _dao) external onlyOwner {
        require(_dao != address(0), "Zero address");
        dao = _dao;
    }

    function upgradeTier(uint8 tierIndex) external {
        require(address(trustToken) != address(0), "Token not set");
        require(tierIndex == 2 || tierIndex == 3, "Invalid tier"); // 2=INSTITUTIONAL, 3=DIAMOND

        uint256 cost;
        if (tierIndex == 2) {
             cost = 5000 * 10**18;
        } else {
             cost = 50000 * 10**18;
        }

        require(trustToken.transferFrom(msg.sender, address(this), cost), "Stake transfer failed");

        issuers[msg.sender] = true;
        addressRoleMap[msg.sender] = Role(tierIndex);

        emit TierUpgraded(msg.sender, Role(tierIndex), cost);
        emit IssuerStatusChanged(msg.sender, true, Role(tierIndex));
    }

    function authorizeTier(address user, uint8 tierIndex) external {
        require(msg.sender == owner() || msg.sender == dao, "Not authorized");
        require(tierIndex == 2 || tierIndex == 3, "Invalid tier");

        issuers[user] = true;
        addressRoleMap[user] = Role(tierIndex);

        emit TierUpgraded(user, Role(tierIndex), 0);
        emit IssuerStatusChanged(user, true, Role(tierIndex));
    }
}
