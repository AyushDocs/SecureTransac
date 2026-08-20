// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol";
import "./CreditSystem.sol";
//created to resolve circular dependency betweeen this and zk verifier
interface IVerifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[2] calldata _pubSignals
    ) external view returns (bool);
}

contract ScoringSystem is CreditSystem {
    mapping(address => bytes) private scores;
    IVerifier public verifier;
    mapping(address => uint256) public provenMaxScoreTillNow;

    mapping(address => bool) public manuallyBlacklisted;
    mapping(address => bool) public manuallyWhitelisted;

    //can be updated later on
    uint256 public whitelistThreshold = 80;
    uint256 public blacklistThreshold = 20;
    uint256 public constant SCORE_UPDATE_COST = 0.05 ether;

    struct ScoreUpdateRecord {
        address reporter;
        address targetUser;
        string reason;
        uint256 timestamp;
        bool paid;
    }

    mapping(address => ScoreUpdateRecord[]) public scoreUpdateHistory;
    mapping(address => uint256) public scoreUpdateCount;

    event ScoreUpdated(address indexed user, bytes newScore);
    event ScoreUpdateRecorded(address indexed reporter, address indexed targetUser, uint256 indexed recordIndex, string reason, bool paid);
    event ProofSubmitted(address indexed user, uint256 provenThreshold);
    event ScoreRevealed(address indexed target, bytes score, address indexed viewer);
    event VerifierUpdated(address indexed newVerifier);
    event Blacklisted(address indexed user, bool status);
    event Whitelisted(address indexed user, bool status);
    event ThresholdsUpdated(uint256 newWhitelist, uint256 newBlacklist);

    function setVerifier(address _verifier) external onlyOwner {
        verifier = IVerifier(_verifier);
        emit VerifierUpdated(_verifier);
    }

    function setWhitelistThreshold(uint256 _whitelist) external onlyOwner {
        require(_whitelist > blacklistThreshold, "Must exceed blacklist threshold");
        require(_whitelist <= 100, "Out of range");
        whitelistThreshold = _whitelist;
        emit ThresholdsUpdated(_whitelist, blacklistThreshold);
    }

    function setBlacklistThreshold(uint256 _blacklist) external onlyOwner {
        require(_blacklist >=0,"Blacklist thresholld must be between 0 to 100");
        require(_blacklist < whitelistThreshold, "Must be below whitelist threshold");
        blacklistThreshold = _blacklist;
        emit ThresholdsUpdated(whitelistThreshold, _blacklist);
    }

    function blacklist(address user, bool status) external onlyOwner {
        manuallyBlacklisted[user] = status;
        if (status) {
            manuallyWhitelisted[user] = false;
        }
        emit Blacklisted(user, status);
    }

    function whitelist(address user, bool status) external onlyOwner {
        manuallyWhitelisted[user] = status;
        if (status) {
            manuallyBlacklisted[user] = false;
        }
        emit Whitelisted(user, status);
    }

    function updateScore(address user, bytes memory newScore, string calldata reason) external onlyReporter {
        bool paid = false;
        if (owner() != _msgSender()) {
            _createAndDeduct(_msgSender(), SCORE_UPDATE_COST, CreditTxnType.GENERIC);
            paid = true;
        }

        scores[user] = newScore;
        provenMaxScoreTillNow[user] = 0;

        uint256 recordIndex = scoreUpdateCount[user];
        scoreUpdateHistory[user].push(ScoreUpdateRecord({
            reporter: msg.sender,
            targetUser: user,
            reason: reason,
            timestamp: block.timestamp,
            paid: paid
        }));
        scoreUpdateCount[user]++;

        emit ScoreUpdated(user, newScore);
        emit ScoreUpdateRecorded(msg.sender, user, recordIndex, reason, paid);
    }

    function attestScore(address user, uint256 scoreValue, string calldata reason) external onlyReporter {
        require(scoreValue <= 100, "Score out of range");

        bool paid = false;
        if (owner() != _msgSender()) {
            _createAndDeduct(_msgSender(), SCORE_UPDATE_COST, CreditTxnType.GENERIC);
            paid = true;
        }

        provenMaxScoreTillNow[user] = scoreValue;

        uint256 recordIndex = scoreUpdateCount[user];
        scoreUpdateHistory[user].push(ScoreUpdateRecord({
            reporter: msg.sender,
            targetUser: user,
            reason: reason,
            timestamp: block.timestamp,
            paid: paid
        }));
        scoreUpdateCount[user]++;

        emit ScoreUpdateRecorded(msg.sender, user, recordIndex, reason, paid);
    }

    function getScoreUpdateHistory(address user) external view returns (ScoreUpdateRecord[] memory) {
        return scoreUpdateHistory[user];
    }

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
        if (claimedThreshold > provenMaxScoreTillNow[msg.sender]) {
            provenMaxScoreTillNow[msg.sender] = claimedThreshold;
        }

        emit ProofSubmitted(msg.sender, claimedThreshold);
    }

    // --- ZK-Based Access Control ---

    function isWhitelisted(address user) public view returns (bool) {
        if (manuallyWhitelisted[user]) return true;
        if (manuallyBlacklisted[user]) return false;
        return provenMaxScoreTillNow[user] >= whitelistThreshold;
    }

    function isBlacklisted(address user) public view returns (bool) {
        if (manuallyBlacklisted[user]) return true;
        if (manuallyWhitelisted[user]) return false;
        return provenMaxScoreTillNow[user] <= blacklistThreshold;
    }

    function isScoreAbove(address user, uint256 threshold) public returns (bool) {
        if (owner() != _msgSender()) {
            _createAndDeduct(_msgSender(), VIEW_COST, CreditTxnType.SCORE_VIEW);
        }
        return provenMaxScoreTillNow[user] >= threshold;
    }

    function accessScore(address target) public returns (bytes memory) {
        if (owner() != _msgSender()) {
             _createAndDeduct(_msgSender(), VIEW_COST, CreditTxnType.SCORE_VIEW);
        }
        bytes memory score = scores[target];
        emit ScoreRevealed(target, score, _msgSender());
        return score;
    }

    /**
     * @dev Admin view for free.
     */
    function getScore(address user) external onlyOwner returns (bytes memory) {
        return scores[user];
    }
}