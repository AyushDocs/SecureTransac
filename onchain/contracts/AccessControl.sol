// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import {Role} from './Role.sol';

contract SecureAccessControl is Ownable {

    mapping(address => bool) public reporters;
    mapping(address => Role) public addressRoleMap;

    event ReporterStatusChanged(address indexed reporter, bool status, Role tier);

    constructor() Ownable(msg.sender) {
        reporters[msg.sender] = true;
        addressRoleMap[msg.sender] = Role.DIAMOND;
    }

    modifier onlyReporter() {
        require(reporters[msg.sender], "Not an authorized reporter");
        _;
    }

    function setReporterStatus(address reporter,bool status,Role role) external onlyOwner {
        reporters[reporter] = status;
        addressRoleMap[reporter] = status ? role : Role.NONE;
        emit ReporterStatusChanged(reporter, status, role);
    }
}
