// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SecureTransacToken ($TRUST)
 * @dev Governance and utility token for the SecureTransac Network.
 */
contract SecureTransacToken is ERC20, ERC20Permit, Ownable {
    constructor() ERC20("SecureTransac Trust Token", "TRUST") ERC20Permit("SecureTransac") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals()); // 1 Million tokens initially
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
