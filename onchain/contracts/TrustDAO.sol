// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ITrustRegistry {
    enum AuthorityTier { NONE, STANDARD, INSTITUTIONAL, DIAMOND }
    function setReporterStatus(address reporter, bool status, AuthorityTier tier) external;
}

contract TrustDAO is Ownable {
    IERC20 public trustToken;
    ITrustRegistry public registry;

    uint256 public constant MIN_STAKE = 1000 * 10**18; 
    uint256 public constant VOTING_PERIOD = 3 minutes; 

    enum ProposalType { GENERIC, KYB_ADMISSION }

    struct Proposal {
        uint256 id;
        ProposalType pType;
        address proposer;
        uint8 targetTier;      
        uint256 stakedAmount;  
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
    
    mapping(address => uint256) public claimableRewards;
    uint256 public totalDistributedRewards;

    event ProposalCreated(uint256 indexed id, string description, ProposalType pType);
    event Voted(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id, bool passed);
    event RefundedWithPenalty(address indexed user, uint256 amount, uint256 penalty);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(address _token, address _registry) Ownable(msg.sender) {
        trustToken = IERC20(_token);
        registry = ITrustRegistry(_registry);
    }

    function stake() external {
        uint256 amount = MIN_STAKE;
        require(trustToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        stakes[msg.sender] += amount;
        isStakedReporter[msg.sender] = true;
        registry.setReporterStatus(msg.sender, true, ITrustRegistry.AuthorityTier.STANDARD);
        emit Staked(msg.sender, amount);
    }

    function submitKYBProposal(uint8 tierIndex, string calldata desc) external {
        uint256 requiredStake = (tierIndex == 3) ? 50000 ether : 5000 ether;
        require(trustToken.transferFrom(msg.sender, address(this), requiredStake), "Stake transfer failed");

        Proposal storage p = proposals[nextProposalId];
        p.id = nextProposalId;
        p.pType = ProposalType.KYB_ADMISSION;
        p.proposer = msg.sender;
        p.targetTier = tierIndex;
        p.stakedAmount = requiredStake;
        p.description = desc;
        p.endTime = block.timestamp + VOTING_PERIOD;
        
        emit ProposalCreated(nextProposalId, desc, ProposalType.KYB_ADMISSION);
        nextProposalId++;
    }

    function createProposal(string calldata desc) external {
        require(isStakedReporter[msg.sender], "Must be staked to propose");
        
        Proposal storage p = proposals[nextProposalId];
        p.id = nextProposalId;
        p.pType = ProposalType.GENERIC;
        p.proposer = msg.sender;
        p.description = desc;
        p.endTime = block.timestamp + VOTING_PERIOD;
        
        emit ProposalCreated(nextProposalId, desc, ProposalType.GENERIC);
        nextProposalId++;
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.endTime, "Voting ended");
        require(!p.hasVoted[msg.sender], "Already voted");

        uint256 weight = trustToken.balanceOf(msg.sender) + stakes[msg.sender];
        require(weight > 0, "No voting weight");

        if (support) p.forVotes += weight;
        else p.againstVotes += weight;

        p.hasVoted[msg.sender] = true;
        emit Voted(proposalId, msg.sender, support, weight);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.endTime, "Voting ongoing");
        require(!p.executed, "Already executed");

        p.executed = true;
        bool passed = p.forVotes > p.againstVotes;
        
        if (passed) {
             if (p.pType == ProposalType.KYB_ADMISSION) {
                 registry.setReporterStatus(p.proposer, true, ITrustRegistry.AuthorityTier(p.targetTier));
                 stakes[p.proposer] += p.stakedAmount;
                 isStakedReporter[p.proposer] = true; 
             }
        } else {
             if (p.pType == ProposalType.KYB_ADMISSION) {
                 uint256 penalty = p.stakedAmount / 10; 
                 uint256 refund = p.stakedAmount - penalty;
                 trustToken.transfer(p.proposer, refund);
                 emit RefundedWithPenalty(p.proposer, refund, penalty);
             }
        }
        
        emit ProposalExecuted(proposalId, passed);
    }

    function distributeRewards(uint256 totalAmount) external onlyOwner {
        require(totalAmount > 0, "No rewards");
        totalDistributedRewards += totalAmount;
        emit RewardsDistributed(totalAmount);
    }

    function claimRewards() external {
        uint256 reward = claimableRewards[msg.sender];
        require(reward > 0, "No rewards");
        claimableRewards[msg.sender] = 0;
        trustToken.transfer(msg.sender, reward);
        emit RewardsClaimed(msg.sender, reward);
    }

    function getHasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }
}
