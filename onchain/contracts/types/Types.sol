// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

enum Role { NONE, STANDARD, INSTITUTIONAL, DIAMOND }

enum CreditTxnType { SCORE_VIEW, SCORE_REVEAL, GENERIC }

enum ProposalType { GENERIC, KYB_ADMISSION }

enum Status { Pending, Approved, Rejected }

struct CreditTransaction {
    address user;
    uint256 amount;
    CreditTxnType txnType;
    uint256 timestamp;
}

struct ScoreUpdateRecord {
    address issuer;
    address targetUser;
    string reason;
    uint256 timestamp;
    bool paid;
}

struct EncryptedData {
    string ipfsHash;
    uint256 timestamp;
    bool exists;
}

struct Request {
    address user;
    uint96 timestamp;
    address company;
    Status status;
    string proofCid;
}
