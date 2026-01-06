// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrustRegistry
 * @dev Manages trust scores for addresses. Scores are between 0 and 1000 (0.0 to 1.0).
 */
contract TrustRegistry is Ownable {
    mapping(address => uint256) public scores;
    mapping(address => bool) public isAuthorizedReporter;

    event ScoreUpdated(address indexed user, uint256 newScore);
    event ReporterStatusChanged(address indexed reporter, bool status);

    constructor() Ownable(msg.sender) {
        // Owner is the default reporter
        isAuthorizedReporter[msg.sender] = true;
    }

    modifier onlyReporter() {
        require(isAuthorizedReporter[msg.sender], "Not an authorized reporter");
        _;
    }

    function setReporterStatus(address reporter, bool status) external onlyOwner {
        isAuthorizedReporter[reporter] = status;
        emit ReporterStatusChanged(reporter, status);
    }

    function updateScore(address user, uint256 newScore) external onlyReporter {
        require(newScore <= 1000, "Score must be between 0 and 1000");
        scores[user] = newScore;
        emit ScoreUpdated(user, newScore);
    }

    function getScore(address user) external view returns (uint256) {
        // Default score is 500 (0.5) if never set
        uint256 score = scores[user];
        return score == 0 ? 500 : score;
    }

    function isWhitelisted(address user) external view returns (bool) {
        uint256 score = scores[user];
        if (score == 0) score = 500;
        return score >= 800;
    }

    function isBlacklisted(address user) external view returns (bool) {
        uint256 score = scores[user];
        if (score == 0) return false; // Default is not blacklisted
        return score <= 200;
    }
}
