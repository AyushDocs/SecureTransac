// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CreditSystem is SecureAccessControl {
    enum CreditTxnType { SCORE_VIEW, SCORE_REVEAL, GENERIC }

    struct CreditTransaction {
        address user;
        uint256 amount;
        CreditTxnType txnType;
        uint256 timestamp;
    }

    mapping(address => uint256) public credits;
    mapping(address => CreditTransaction[]) public creditHistory;
    mapping(address => uint256) public creditTxnCount;

    uint256 public constant VIEW_COST = 0.01 ether;
    IERC20 public trustToken;

    event CreditsDeposited(address indexed user, uint256 amount);
    event CreditTransactionCreated(address indexed user, uint256 indexed txnIndex, uint256 amount, CreditTxnType txnType);

    function setTrustToken(address _token) external onlyOwner {
        trustToken = IERC20(_token);
    }

    /**
     * @dev Deposit $AV tokens to get credits.
     * 1 wei AV = 1 credit unit.
     * Requires the user to approve this contract to spend $AV first.
     */
    function deposit(uint256 amount) public {
        require(address(trustToken) != address(0), "Token not set");
        require(amount > 0, "Must deposit non-zero amount");
        require(trustToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        credits[msg.sender] += amount;
        emit CreditsDeposited(msg.sender, amount);
    }

    function getBalance() public view returns (uint256) {
        return credits[msg.sender];
    }

    function getCreditHistory(address user) external view returns (CreditTransaction[] memory) {
        return creditHistory[user];
    }

    function _createAndDeduct(address user, uint256 amount, CreditTxnType txnType) internal {
        require(credits[user] >= amount, "Insufficient credits");
        credits[user] -= amount;

        uint256 txnIndex = creditTxnCount[user];
        creditHistory[user].push(CreditTransaction({
            user: user,
            amount: amount,
            txnType: txnType,
            timestamp: block.timestamp
        }));
        creditTxnCount[user]++;

        emit CreditTransactionCreated(user, txnIndex, amount, txnType);
    }

    // Allow admin to withdraw AV tokens accumulated in the contract
    function withdraw() public onlyOwner {
        uint256 balance = trustToken.balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        require(trustToken.transfer(owner(), balance), "Withdraw transfer failed");
    }
}
