// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AVToken ($AV)
 * @dev Governance and utility token for the SecureTransac Network.
 */
contract AVToken is ERC20, ERC20Permit, Ownable {
    constructor() ERC20("SecureTransac Trust Token", "AV") ERC20Permit("SecureTransac") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
