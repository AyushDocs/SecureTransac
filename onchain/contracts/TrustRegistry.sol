// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ScoringSystem.sol";
import "./TransactionLogger.sol";
import "./ReportingSystem.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TrustRegistry
 * @dev Aggregator contract inheriting split functionality.
 * Kept for backward compatibility with existing deployment scripts and frontend.
 * Ideally, frontend would interact with specific contracts, but this wrapper simplifies migration.
 */
contract TrustRegistry is ScoringSystem, TransactionLogger, ReportingSystem {
    IERC20 public trustToken;

    event TierUpgraded(address indexed user, AuthorityTier tier, uint256 stakedAmount);

    constructor() SecureAccessControl() {
        // Constructor logic if any necessary beyond inherited ones
        // AccessControl constructor (via ScoringSystem -> AccessControl) sets msg.sender as reporter
    }
    
    function setTrustToken(address _token) external onlyOwner {
        trustToken = IERC20(_token);
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
        
        isAuthorizedReporter[msg.sender] = true;
        reporterTier[msg.sender] = AuthorityTier(tierIndex);
        
        emit TierUpgraded(msg.sender, AuthorityTier(tierIndex), cost);
        emit ReporterStatusChanged(msg.sender, true, AuthorityTier(tierIndex));
    }
}
