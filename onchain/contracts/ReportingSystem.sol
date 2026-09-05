// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol";

contract ReportingSystem is SecureAccessControl {
    event ReportSubmitted(address indexed issuer, address indexed target, string reason, uint256 timestamp);

    function submitReport(address target, string calldata reason) external onlyIssuer {
        emit ReportSubmitted(msg.sender, target, reason, block.timestamp);
    }
}
