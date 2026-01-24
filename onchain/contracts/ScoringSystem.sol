// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol";
import "./CreditSystem.sol";

contract ScoringSystem is CreditSystem {
    mapping(address => uint256) private scores;
    
    uint256 public whitelistThreshold = 80; // 0.8
    uint256 public blacklistThreshold = 20; // 0.2

    event ScoreUpdated(address indexed user, uint256 newScore);
    event ThresholdUpdated(uint256 whitelistThreshold, uint256 blacklistThreshold);
    event ScoreRevealed(address indexed target, uint256 score, address indexed viewer);

    function updateScore(address user, uint256 newScore) external onlyReporter {
        require(newScore <= 100, "Score must be between 0 and 100");
        scores[user] = newScore;
        emit ScoreUpdated(user, newScore);
    }

    function setThresholds(
        uint256 _whitelistThreshold,
        uint256 _blacklistThreshold
    ) external onlyOwner {
        require(_whitelistThreshold <= 100, "Whitelist threshold must be <= 100");
        require(_blacklistThreshold <= 100, "Blacklist threshold must be <= 100");
        require(_whitelistThreshold > _blacklistThreshold, "Whitelist must be > blacklist");

        whitelistThreshold = _whitelistThreshold;
        blacklistThreshold = _blacklistThreshold;
        emit ThresholdUpdated(_whitelistThreshold, _blacklistThreshold);
    }

    /**
     * @dev Pay to view a score. Deducts credits from user.
     */
    function accessScore(address target) public returns (uint256) {
        // Admin can view for free (owner)
        if (owner() != _msgSender()) {
             _deductCredits(_msgSender(), VIEW_COST);
        }
        
        uint256 score = scores[target];
        if (score == 0) score = 50; // Default 0.5
        
        emit ScoreRevealed(target, score, _msgSender());
        return score;
    }

    /**
     * @dev Admin view for free.
     */
    function getScore(address user) external view returns (uint256) {
        uint256 score = scores[user];
        return score == 0 ? 50 : score;
    }

    function isWhitelisted(address user) public view returns (bool) {
        uint256 score = scores[user];
        if (score == 0) score = 50;
        return score >= whitelistThreshold;
    }

    function isBlacklisted(address user) public view returns (bool) {
        uint256 score = scores[user];
        if (score == 0) return false; 
        return score <= blacklistThreshold;
    }
}
