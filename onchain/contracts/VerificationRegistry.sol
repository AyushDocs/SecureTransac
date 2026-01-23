// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VerificationRegistry is Ownable {
    enum Status { Pending, Approved, Rejected }

    struct Request {
        address user;
        uint96 timestamp; // Packed
        address company;
        Status status;    // Packed
        string proofCid;
    }

    Request[] public requests;
    // Removed redundant mappings for gas optimization (use events instead)

    event VerificationRequested(uint256 indexed requestId, address indexed user, address indexed company, string proofCid);
    event VerificationProcessed(uint256 indexed requestId, Status status, address reviewer);

    constructor() Ownable(msg.sender) {}

    function requestVerification(address company, string calldata proofCid) external {
        uint256 requestId = requests.length;
        requests.push(Request({
            user: msg.sender,
            timestamp: uint96(block.timestamp),
            company: company,
            status: Status.Pending,
            proofCid: proofCid
        }));
        
        emit VerificationRequested(requestId, msg.sender, company, proofCid);
    }

    function processVerification(uint256 requestId, Status status) external {
        require(requestId < requests.length, "Invalid request ID");
        Request storage req = requests[requestId];
        require(msg.sender == req.company, "Only the assigned company can process");
        require(req.status == Status.Pending, "Already processed");

        req.status = status;
        emit VerificationProcessed(requestId, status, msg.sender);
    }

    function getRequestCount() external view returns (uint256) {
        return requests.length;
    }
}
