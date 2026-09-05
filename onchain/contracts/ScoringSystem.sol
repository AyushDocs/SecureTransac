// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AccessControl.sol";
import "./CreditSystem.sol";
import "./types/Types.sol";
import "./interfaces/IVerifier.sol";
import "./interfaces/IPoseidonT3.sol";

contract ScoringSystem is CreditSystem {
    mapping(address => bytes) private scores;
    IVerifier public verifier;
    IPoseidonT3 public poseidonHash;
    mapping(address => uint256) public provenMaxScoreTillNow;
    mapping(address => uint256) public poseidonCommitment;

    mapping(address => bool) public manuallyBlacklisted;
    mapping(address => bool) public manuallyWhitelisted;

    uint256 public whitelistThreshold = 80;
    uint256 public blacklistThreshold = 20;
    uint256 public constant SCORE_UPDATE_COST = 0.05 ether;

    mapping(address => ScoreUpdateRecord[]) public scoreUpdateHistory;
    mapping(address => uint256) public scoreUpdateCount;

    event ScoreUpdated(address indexed user, bytes newScore);
    event ScoreUpdateRecorded(address indexed issuer, address indexed targetUser, uint256 indexed recordIndex, string reason, bool paid);
    event ProofSubmitted(address indexed user, uint256 provenThreshold);
    event ScoreRevealed(address indexed target, bytes score, address indexed viewer);
    event VerifierUpdated(address indexed newVerifier);
    event PoseidonUpdated(address indexed newPoseidon);
    event Blacklisted(address indexed user, bool status);
    event Whitelisted(address indexed user, bool status);
    event ThresholdsUpdated(uint256 newWhitelist, uint256 newBlacklist);

    function setVerifier(address _verifier) external onlyOwner {
        verifier = IVerifier(_verifier);
        emit VerifierUpdated(_verifier);
    }

    function setPoseidonHash(address _poseidon) external onlyOwner {
        poseidonHash = IPoseidonT3(_poseidon);
        emit PoseidonUpdated(_poseidon);
    }

    function setWhitelistThreshold(uint256 _whitelist) external onlyOwner {
        require(_whitelist > blacklistThreshold, "Must exceed blacklist threshold");
        require(_whitelist <= 100, "Out of range");
        whitelistThreshold = _whitelist;
        emit ThresholdsUpdated(_whitelist, blacklistThreshold);
    }

    function setBlacklistThreshold(uint256 _blacklist) external onlyOwner {
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

    function updateScore(address user, bytes memory newScore, string calldata reason) external onlyIssuer {
        bool paid = false;
        if (owner() != _msgSender()) {
            _createAndDeduct(_msgSender(), SCORE_UPDATE_COST, CreditTxnType.GENERIC);
            paid = true;
        }

        scores[user] = newScore;
        provenMaxScoreTillNow[user] = 0;

        if (address(poseidonHash) != address(0)) {
            poseidonCommitment[user] = poseidonHash.poseidon([uint256(keccak256(newScore)), 0]);
        }

        uint256 recordIndex = scoreUpdateCount[user];
        scoreUpdateHistory[user].push(ScoreUpdateRecord({
            issuer: msg.sender,
            targetUser: user,
            reason: reason,
            timestamp: block.timestamp,
            paid: paid
        }));
        scoreUpdateCount[user]++;

        emit ScoreUpdated(user, newScore);
        emit ScoreUpdateRecorded(msg.sender, user, recordIndex, reason, paid);
    }

    function attestScore(address user, uint256 scoreValue, string calldata reason) external onlyIssuer {
        require(scoreValue <= 100, "Score out of range");

        bool paid = false;
        if (owner() != _msgSender()) {
            _createAndDeduct(_msgSender(), SCORE_UPDATE_COST, CreditTxnType.GENERIC);
            paid = true;
        }

        provenMaxScoreTillNow[user] = scoreValue;
        scores[user] = abi.encode(scoreValue);

        uint256 recordIndex = scoreUpdateCount[user];
        scoreUpdateHistory[user].push(ScoreUpdateRecord({
            issuer: msg.sender,
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
        pubSignals[0] = poseidonCommitment[msg.sender];
        pubSignals[1] = claimedThreshold;

        bool result = verifier.verifyProof(_pA, _pB, _pC, pubSignals);
        require(result, "Invalid ZK Proof");

        if (claimedThreshold > provenMaxScoreTillNow[msg.sender]) {
            provenMaxScoreTillNow[msg.sender] = claimedThreshold;
        }

        emit ProofSubmitted(msg.sender, claimedThreshold);
    }

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
             _createAndDeduct(_msgSender(), VIEW_CREDIT_COST, CreditTxnType.SCORE_VIEW);
        }
        return provenMaxScoreTillNow[user] >= threshold;
    }

    function accessScore(address target) public returns (bytes memory) {
        if (owner() != _msgSender()) {
            _createAndDeduct(_msgSender(), VIEW_CREDIT_COST, CreditTxnType.SCORE_VIEW);
        }
        bytes memory score = scores[target];
        emit ScoreRevealed(target, score, _msgSender());
        return score;
    }

    function getScore(address user) external view onlyOwner returns (bytes memory) {
        return scores[user];
    }
}
