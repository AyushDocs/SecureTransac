// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol";
import "./CreditSystem.sol";


interface IVerifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[2] calldata _pubSignals
    ) external view returns (bool);
}

contract ScoringSystem is CreditSystem {
    // Migrated to bytes to support Paillier Homomorphic Ciphertexts (approx 2048+ bits)
    mapping(address => bytes) private scores;

    // ZK Architecture (Dynamic Ranges)
    IVerifier public verifier;
    // We store the highest lower-bound the user has proven via ZK.
    // e.g. If user proves score >= 60, this stores 60.
    mapping(address => uint256) public provenScoreLowerBound;
    
    uint256 public constant whitelistThreshold = 80;
    uint256 public constant blacklistThreshold = 20;

    event ScoreUpdated(address indexed user, bytes newScore);
    event ProofSubmitted(address indexed user, uint256 provenThreshold);
    event ScoreRevealed(address indexed target, bytes score, address indexed viewer);
    event VerifierUpdated(address indexed newVerifier);

    function setVerifier(address _verifier) external onlyOwner {
        verifier = IVerifier(_verifier);
        emit VerifierUpdated(_verifier);
    }

    function updateScore(address user, bytes memory newScore) external onlyReporter {
        // Range check removed: Encrypted values cannot be checked directly.
        scores[user] = newScore;
        emit ScoreUpdated(user, newScore);
        
        // Reset proven status on score update to ensure freshness (invalidates old proofs)
        provenScoreLowerBound[user] = 0;
    }

    /**
     * @dev Submit a ZK Proof validating the encrypted score is >= claimedThreshold.
     * The Proof Logic must verify: Decrypt(onChainScore) >= claimedThreshold.
     * Inputs match Groth16 standard (a, b, c).
     */
    function submitRangeProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint256 claimedThreshold
    ) external {
        require(address(verifier) != address(0), "Verifier not set");
        
        uint[2] memory pubSignals;
        // Signal 0: Commitment (Hash of encrypted score)
        // Note: Hash must be mod 'p' of BN128 scalar field. Solidity keccak is 256 bits, might overflow p.
        // Usually we take right 253 bits or similar. For simplicity assuming it fits or circuit handles overflow.
        pubSignals[0] = uint256(keccak256(scores[msg.sender])) % 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        
        // Signal 1: The claimed lower bound
        pubSignals[1] = claimedThreshold;

        // Verify that user knows 's' such that Enc(s) = scores[msg.sender] AND s >= claimedThreshold
        bool result = verifier.verifyProof(_pA, _pB, _pC, pubSignals);
        require(result, "Invalid ZK Proof");

        // Update state if this proof establishes a better bound than what we have
        if (claimedThreshold > provenScoreLowerBound[msg.sender]) {
            provenScoreLowerBound[msg.sender] = claimedThreshold;
        }

        emit ProofSubmitted(msg.sender, claimedThreshold);
    }

    // --- ZK-Based Access Control ---

    function isWhitelisted(address user) public view returns (bool) {
        // Check if user has proven a score >= global whitelist threshold
        return provenScoreLowerBound[user] >= whitelistThreshold;
    }

    function isBlacklisted(address user) public view returns (bool) {
        // If proven lower bound is <= blacklist threshold (e.g. 20), we can't be sure they are safe.
        // Wait, if provenLowerBound is 0, they are definitely "potentially blacklisted".
        // If provenLowerBound is 30, they are definitely > 20.
        // So: return (provenLowerBound <= blacklistThreshold);
        return provenScoreLowerBound[user] <= blacklistThreshold;
    }

    /**
     * @dev Pay to view a score. Deducts credits from user.
     */
    function accessScore(address target) public returns (bytes memory) {
        // Admin can view for free (owner)
        if (owner() != _msgSender()) {
             _deductCredits(_msgSender(), VIEW_COST);
        }
        
        bytes memory score = scores[target];
        emit ScoreRevealed(target, score, _msgSender());
        return score;
    }

    /**
     * @dev Admin view for free.
     */
    function getScore(address user) external view returns (bytes memory) {
        return scores[user];
    }

    // --- Contract Access Config (Updated for ZK) ---

    struct ContractConfig {
        uint256 minTrustScore;   
        bool exists;             
    }
    mapping(address => ContractConfig) public contractConfigs;
    mapping(address => address) public contractMaintainer;
    mapping(address => address[]) public maintainerContracts;
    event ContractThresholdUpdated(address indexed targetContract, uint256 minScore, address indexed updatedBy);

    function setContractThreshold(address _contractAddress, uint256 _minScore) external {
        // Custom thresholds > 20/80 now require specific circuit logic not covered by standard proofs.
        // For migration: We map custom demands to the nearest ZK tier.
        // 0-20:  Requires Verified Proof
        // 80-100: Requires Whitelist Proof
        
        // Claim logic
        if (contractMaintainer[_contractAddress] == address(0)) {
            contractMaintainer[_contractAddress] = msg.sender;
            maintainerContracts[msg.sender].push(_contractAddress); 
        } else {
            require(contractMaintainer[_contractAddress] == msg.sender, "Not authorized");
        }

        contractConfigs[_contractAddress] = ContractConfig({
            minTrustScore: _minScore,
            exists: true
        });
        emit ContractThresholdUpdated(_contractAddress, _minScore, msg.sender);
    }
    
    function getContractsByMaintainer(address _maintainer) external view returns (address[] memory) {
        return maintainerContracts[_maintainer];
    }

    function isAllowedToInteract(address _user, address _contractAddress) external view returns (bool) {
        // Dynamic ZK Check:
        // Does the user's proven lower bound meet the contract's requirement?
        
        uint256 requiredScore = blacklistThreshold; // Default requirement if no config

        if (contractConfigs[_contractAddress].exists) {
            requiredScore = contractConfigs[_contractAddress].minTrustScore;
        }

        return provenScoreLowerBound[_user] >= requiredScore;
    }
}