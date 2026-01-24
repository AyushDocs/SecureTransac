// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol";

contract CreditSystem is AccessControl { // Inherit AccessControl to share base with others
    mapping(address => uint256) public credits;
    uint256 public constant VIEW_COST = 0.01 ether; // Cost to view a private score (in wei/credits)
    
    // SCALE: 1 ETH = 1 Credit (for simplicity in this demo, using wei values directly)
    // In a real app, you might want a different exchange rate. Here 1 wei deposited = 1 unit credit.

    event CreditsDeposited(address indexed user, uint256 amount);
    event CreditsDeducted(address indexed user, uint256 amount);

    /**
     * @dev Deposit ETH to get credits. 
     * 1 wei = 1 credit unit.
     */
    function deposit() public payable {
        require(msg.value > 0, "Must deposit non-zero amount");
        credits[msg.sender] += msg.value;
        emit CreditsDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Returns the credit balance of the caller.
     */
    function myCredits() public view returns (uint256) {
        return credits[msg.sender];
    }

    /**
     * @dev Internal function to deduct credits.
     * Throws if insufficient balance.
     */
    function _deductCredits(address user, uint256 amount) internal {
        require(credits[user] >= amount, "Insufficient credits");
        credits[user] -= amount;
        emit CreditsDeducted(user, amount);
    }
    
    // Allow admin to withdraw funds accumulated in the contract
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}
