# Zero-Knowledge Privacy Architecture

## Overview
This project successfully implements a **Privacy-First AV Score System** using a hybrid cryptographic approach. AV Scores are sensitive data; therefore, they should never be exposed in plaintext on the public blockchain.

Our architecture ensures:
1.  **Encrypted Storage**: Scores are encrypted homomorphically using Paillier Encryption before storage.
2.  **Verifiable Privacy**: Users (and third-party contracts) can verify that a user meets a AV threshold (e.g., > 80) **without revealing the actual score**.
3.  **Zero-Knowledge Proofs**: We utilize Groth16 zk-SNARKs (via `circom` and `snarkjs`) to prove range assertions on the encrypted data.

## Deployment Stack
-   **Cipher**: Paillier Cryptosystem (partially homomorphic for aggregation/weighted addition).
-   **Proof System**: Groth16 (bn128 curve).
-   **Contract**: `ScoringSystem.sol` (Updated to store `bytes` ciphertext and verify proofs via `IVerifier`).

## User Flow
1.  **Score Generation**:
    *   AI Engine calculates score (0-1).
    *   Backend (Admin) acts as the Key Holder (Trusted Reporter).
    *   Backend generates Paillier Keys (`1024-bit` for demo) and encrypts the score.
    *   Backend submits `Enc(score)` to the Smart Contract.
2.  **Verification**:
    *   Third Party (e.g., `LoanContract`) requires `TrustScore > 80`.
    *   User requests a Proof from the Backend (Delegated Prover).
        *   *Note: Since Backend randomly salts the encryption, it must generate the proof.*
    *   Backend generates a ZK Proof asserting `Dec(Enc(score)) >= 80`.
    *   User submits this Proof to `ScoringSystem.submitRangeProof(proof, 80)`.
    *   Contract verifies the proof on-chain and updates `provenScoreLowerBound[user] = 80`.
3.  **Access**:
    *   `LoanContract` calls `isAllowedToInteract(user)` which checks `provenScoreLowerBound`.
    *   Access is granted without the contract ever knowing if the score is `81` or `99`.

## Operational Commands
### Compile ZK Circuit
```bash
cd zk
npm install
sh generate_zk_proofs.sh
```

### Backend Keys
The backend generates Paillier keys in-memory on startup (`web3Service.js`).
**Warning**: In a production environment, these keys MUST be persisted (e.g., KMS or `.env`), otherwise restarting the server renders all on-chain scores undecryptable.

## Status
-   [x] Smart Contract Migration (Bytes Storage + ZK Verifier)
-   [x] Backend Paillier Integration
-   [x] ZK Circuit Implementation (`trust_score_verifier.circom`)
-   [x] Frontend "Verify My Score" UI

