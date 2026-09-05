// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol";

contract TransactionLogger is SecureAccessControl {
    event TransactionLogged(address indexed from, address indexed to, uint256 amount, uint256 timestamp);

    function recordTransaction(address from, address to, uint256 amount) external onlyIssuer {
        emit TransactionLogged(from, to, amount, block.timestamp);
    }
}
