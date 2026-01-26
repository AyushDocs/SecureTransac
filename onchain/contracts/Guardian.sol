// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TrustRegistry.sol";

/**
 * @title Guardian
 * @dev Base contract to provide trust-score based access control.
 */
abstract contract Guardian {
    TrustRegistry public immutable registry;
    uint256 public minRequiredScore;

    error InsufficientTrustScore(address user, uint256 score, uint256 required);
    error AddressBlacklisted(address user);

    constructor(address _registry, uint256 _minScore) {
        registry = TrustRegistry(_registry);
        minRequiredScore = _minScore;
    }

    modifier onlyTrusted() {
        // Use ZK verified lower bound instead of raw encrypted score
        uint256 userScore = registry.provenScoreLowerBound(msg.sender);
        
        require(!registry.isBlacklisted(msg.sender), "Address blacklisted");
        if (userScore < minRequiredScore) {
             revert InsufficientTrustScore(msg.sender, userScore, minRequiredScore);
        }
        _;
    }

    function updateMinScore(uint256 _newMinScore) internal {
        minRequiredScore = _newMinScore;
    }
}
