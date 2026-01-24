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
    constructor() AccessControl() {
        // Constructor logic if any necessary beyond inherited ones
        // AccessControl constructor (via ScoringSystem -> AccessControl) sets msg.sender as reporter
    }
    
    // Wrapper functions if needed to expose inherited public functions generally work automatically.
    // However, Solidity inheritance rules for functions with same name (if any) need overrides.
    // Here we have distinct functions so it should be fine.
}
