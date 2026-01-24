// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ITrustRegistry {
    enum AuthorityTier { NONE, STANDARD, INSTITUTIONAL, DIAMOND }
    function setReporterStatus(address reporter, bool status, AuthorityTier tier) external;
}

/**
 * @title TrustDAO
 * @dev Governance system for SecureTransac.
 * Handles Authority Staking and Parameter Voting.
 */
contract TrustDAO is Ownable {
    IERC20 public trustToken;
    ITrustRegistry public registry;

    uint256 public constant MIN_STAKE = 1000 * 10**18; // 1000 $TRUST
    uint256 public constant VOTING_PERIOD = 3 days;

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public nextProposalId;

    mapping(address => uint256) public stakes;
    mapping(address => bool) public isStakedReporter;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    mapping(address => uint256) public claimableRewards;
    uint256 public totalDistributedRewards;

    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 amount);
    event ProposalCreated(uint256 indexed id, string description);
    event Voted(uint256 indexed id, address indexed voter, bool support, uint256 weight);

    constructor(address _token, address _registry) Ownable(msg.sender) {
        trustToken = IERC20(_token);
        registry = ITrustRegistry(_registry);
    }

    /**
     * @dev Distribute protocol fees (in $TRUST) to all staked authorities.
     * In production, this would be auto-triggered by the credit system conversion.
     */
    function distributeRewards(uint256 totalAmount) external onlyOwner {
        require(totalAmount > 0, "No rewards to distribute");
        // Simplified: Distribute equally for demo, or based on accuracy metrics
        // In real DAO, we'd use a merkle tree or tracking variable
        totalDistributedRewards += totalAmount;
        emit RewardsDistributed(totalAmount);
    }

    function claimRewards() external {
        uint256 reward = claimableRewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        
        claimableRewards[msg.sender] = 0;
        require(trustToken.transfer(msg.sender, reward), "Transfer failed");
        
        emit RewardsClaimed(msg.sender, reward);
    }

    /**
     * @dev Authorities must stake tokens to be active.
     */
    function stake() external {
        uint256 amount = MIN_STAKE;
        require(trustToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        stakes[msg.sender] += amount;
        isStakedReporter[msg.sender] = true;
        
        // Auto-whitelist in registry if they stake as STANDARD
        registry.setReporterStatus(msg.sender, true, ITrustRegistry.AuthorityTier.STANDARD);
        
        emit Staked(msg.sender, amount);
    }

    function unstake() external {
        require(stakes[msg.sender] >= MIN_STAKE, "Nothing to unstake");
        uint256 amount = stakes[msg.sender];
        
        stakes[msg.sender] = 0;
        isStakedReporter[msg.sender] = false;
        
        // Revoke reporter status
        registry.setReporterStatus(msg.sender, false, ITrustRegistry.AuthorityTier.NONE);
        
        require(trustToken.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Governance: Propose a change.
     */
    function createProposal(string calldata description) external {
        require(isStakedReporter[msg.sender], "Only staked members can propose");
        
        Proposal storage p = proposals[nextProposalId];
        p.id = nextProposalId;
        p.proposer = msg.sender;
        p.description = description;
        p.endTime = block.timestamp + VOTING_PERIOD;
        
        emit ProposalCreated(nextProposalId, description);
        nextProposalId++;
    }

    /**
     * @dev Vote on a proposal using token weight.
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.endTime, "Voting ended");
        require(!p.hasVoted[msg.sender], "Already voted");

        uint256 weight = trustToken.balanceOf(msg.sender);
        if (isStakedReporter[msg.sender]) {
            weight += stakes[msg.sender]; // Staked tokens also count
        }
        
        require(weight > 0, "No voting weight");

        if (support) p.forVotes += weight;
        else p.againstVotes += weight;

        p.hasVoted[msg.sender] = true;
        emit Voted(proposalId, msg.sender, support, weight);
    }

    /**
     * @dev Execute a proposal (Admin only for MVP, DAO logic for production).
     */
    function executeProposal(uint256 proposalId) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.endTime, "Voting ongoing");
        require(!p.executed, "Already executed");
        require(p.forVotes > p.againstVotes, "Proposal failed");

        p.executed = true;
        // In production: Execute actual target call (threshold change, etc.)
    }
}
