// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Reporting does not necessarily need strict access control if meant to be public, 
// but referencing AccessControl for consistency or future restrictions.
import "./AccessControl.sol";

contract ReportingSystem is SecureAccessControl {
    event ReportSubmitted(address indexed reporter, address indexed target, string reason, uint256 timestamp);

    function submitReport(address target, string calldata reason) external onlyReporter {
        emit ReportSubmitted(msg.sender, target, reason, block.timestamp);
    }
}
