// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AccessControl is Ownable {
    enum AuthorityTier { NONE, STANDARD, INSTITUTIONAL, DIAMOND }
    
    mapping(address => bool) public isAuthorizedReporter;
    mapping(address => AuthorityTier) public reporterTier;

    event ReporterStatusChanged(address indexed reporter, bool status, AuthorityTier tier);

    constructor() Ownable(msg.sender) {
        // Owner is the default Diamond reporter
        isAuthorizedReporter[msg.sender] = true;
        reporterTier[msg.sender] = AuthorityTier.DIAMOND;
    }

    modifier onlyReporter() {
        require(isAuthorizedReporter[msg.sender], "Not an authorized reporter");
        _;
    }

    function setReporterStatus(
        address reporter,
        bool status,
        AuthorityTier tier
    ) external onlyOwner {
        isAuthorizedReporter[reporter] = status;
        reporterTier[reporter] = status ? tier : AuthorityTier.NONE;
        emit ReporterStatusChanged(reporter, status, tier);
    }
}
