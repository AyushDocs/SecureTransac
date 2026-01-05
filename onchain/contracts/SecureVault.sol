// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Guardian.sol";

/**
 * @title SecureVault
 * @dev Example contract demonstrating SecureTransac protection.
 */
contract SecureVault is Guardian {
    string public secret;

    constructor(address _registry) Guardian(_registry, 700) {
        secret = "This is a protected secret!";
    }

    function setSecret(string calldata _newSecret) external onlyTrusted {
        secret = _newSecret;
    }

    function getSecret() external view onlyTrusted returns (string memory) {
        return secret;
    }
}
