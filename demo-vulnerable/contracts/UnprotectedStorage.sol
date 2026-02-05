// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UnprotectedStorage {
    address public owner;
    uint256 public secretData;

    constructor() {
        owner = msg.sender;
    }

    // VULNERABILITY: Missing modifier (e.g., onlyOwner)
    function updateSecret(uint256 _newSecret) public {
        secretData = _newSecret;
    }
}
