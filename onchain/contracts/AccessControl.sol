// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import {Role} from './types/Types.sol';

contract SecureAccessControl is Ownable {

    mapping(address => bool) public issuers;
    mapping(address => Role) public addressRoleMap;

    event IssuerStatusChanged(address indexed issuer, bool status, Role role);

    constructor() Ownable(msg.sender) {
        issuers[msg.sender] = true;
        addressRoleMap[msg.sender] = Role.DIAMOND;
    }

    modifier onlyIssuer() {
        require(issuers[msg.sender], "Not an authorized issuer");
        _;
    }

    function setIssuerStatus(address issuer, bool status, Role role) external onlyOwner {
        issuers[issuer] = status;
        addressRoleMap[issuer] = status ? role : Role.NONE;
        emit IssuerStatusChanged(issuer, status, role);
    }
}
