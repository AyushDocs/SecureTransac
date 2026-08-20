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
        require(!registry.isBlacklisted(msg.sender), "Address blacklisted");
        bool above = registry.isScoreAbove(msg.sender, minRequiredScore);
        if (!above) {
             revert InsufficientTrustScore(msg.sender, registry.provenMaxScoreTillNow(msg.sender), minRequiredScore);
        }
        _;
    }

    function updateMinScore(uint256 _newMinScore) internal {
        minRequiredScore = _newMinScore;
    }
}
