// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../onchain/contracts/Guardian.sol";

/**
 * @title SecureBank
 * @dev This contract has the same logical error as VulnerableBank,
 * but it is protected by SecureTransac's Guardian layer.
 * Even if a vulnerability exists, a malicious actor (low trust score)
 * will be blocked from calling the sensitive functions.
 */
contract SecureBank is Guardian {
    mapping(address => uint256) public balances;

    constructor(address _registry) Guardian(_registry, 800) {}

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external onlyTrusted {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Insufficient balance");

        // NOTE: The logical error still exists here!
        // But only users with 0.8+ score can even try to exploit it.
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        balances[msg.sender] = 0;
    }

    receive() external payable {}
}
