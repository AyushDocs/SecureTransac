// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TrustRegistry.sol";

/**
 * @title Guardian
 * @dev Base contract to provide trust-score based access control.
 * Reads provenMaxScoreTillNow directly to avoid credit charges on every access check.
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
        if (registry.isBlacklisted(msg.sender)) {
            revert AddressBlacklisted(msg.sender);
        }
        uint256 score = registry.provenMaxScoreTillNow(msg.sender);
        if (score < minRequiredScore) {
            revert InsufficientTrustScore(msg.sender, score, minRequiredScore);
        }
        _;
    }

    function updateMinScore(uint256 _newMinScore) internal {
        minRequiredScore = _newMinScore;
    }
}
