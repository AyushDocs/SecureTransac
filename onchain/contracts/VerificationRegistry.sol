// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./types/Types.sol";
import "./interfaces/ITrustRegistry.sol";

interface IScoringSystem {
    function attestScore(address user, uint256 scoreValue, string calldata reason) external;
}

contract VerificationRegistry is Ownable {
    IScoringSystem public scoringSystem;

    Request[] public requests;
    mapping(address => uint256) public lastRequestTimestamp;
    uint256 public constant REQUEST_COOLDOWN = 1 days;

    event VerificationRequested(uint256 indexed requestId, address indexed user, address indexed company, string proofCid);
    event VerificationProcessed(uint256 indexed requestId, Status status, address reviewer);
    event ScoreAttestedFromVerification(uint256 indexed requestId, address indexed user, uint256 score);
    event ScoringSystemUpdated(address indexed newScoringSystem);

    constructor(address _scoringSystem) Ownable(msg.sender) {
        scoringSystem = IScoringSystem(_scoringSystem);
    }

    function setScoringSystem(address _scoringSystem) external onlyOwner {
        require(_scoringSystem != address(0), "Zero address");
        scoringSystem = IScoringSystem(_scoringSystem);
        emit ScoringSystemUpdated(_scoringSystem);
    }

    function requestVerification(address user, address company, string calldata proofCid) external {
        require(lastRequestTimestamp[msg.sender] + REQUEST_COOLDOWN <= block.timestamp, "Cooldown active");
        lastRequestTimestamp[msg.sender] = block.timestamp;

        uint256 requestId = requests.length;
        requests.push(Request({
            user: user,
            timestamp: uint96(block.timestamp),
            company: company,
            status: Status.Pending,
            proofCid: proofCid
        }));

        emit VerificationRequested(requestId, user, company, proofCid);
    }

    function processVerification(uint256 requestId, Status status, uint256 scoreValue) external {
        require(requestId < requests.length, "Invalid request ID");
        Request storage req = requests[requestId];
        require(msg.sender == req.company, "Only the assigned company can process");
        require(req.status == Status.Pending, "Already processed");

        req.status = status;

        if (status == Status.Approved) {
            require(scoreValue <= 100, "Score out of range");
            scoringSystem.attestScore(req.user, scoreValue, string(abi.encodePacked("Verified by ", msg.sender)));
            emit ScoreAttestedFromVerification(requestId, req.user, scoreValue);
        }

        emit VerificationProcessed(requestId, status, msg.sender);
    }

    function getRequestCount() external view returns (uint256) {
        return requests.length;
    }
}
