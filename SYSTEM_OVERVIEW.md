# 📄 SecureTransac: System Overview (v2.0 Stable)

SecureTransac is a decentralized security and reputation layer designed for the Ethereum ecosystem. It bridges the gap between on-chain behavioral data and actionable AV scores while preserving user privacy through Zero-Knowledge Proofs and Homomorphic Encryption.

---

## 🛠️ Core Modules

### 1. Unified AV Registry & AI Scoring
- **On-Chain Source of Truth**: User scores and transaction histories are stored permanently on the Ethereum ledger.
- **AI Score Service**: A backend engine that runs a neural network trained on real labeled Ethereum data (public fraud dataset, 9.8k addresses) to predict fraud probability from on-chain activity — volume, frequency, network degree, temporal cadence, and value flows — producing dynamic reputation scores (0-1). See [ai/README.md](ai/README.md).
- **Social Graph Analysis**: Implements "Guilt by Association" algorithms to boost users in high-AV circles and penalize interaction with known bad actors.

### 2. Identity Vault (Privacy-Preserving KYC)
- **AES-256 Encryption**: User PII is encrypted on the client side before being pinned to IPFS via Pinata.
- **ZK-Proof Integration**: Users generate ZK-SNARKs (via Circom) to prove they meet specific AV thresholds without revealing their exact score or identity.
- **Permissioned Reveal**: Verified authorities can request access to sensitive data, which remains encrypted until the user approves the decryption request.

### 3. DAO Governance & Economy
- **AV Token ($AV)**: The ecosystem's utility and governance token (ERC20 with EIP-2612 Permit).
- **Staking-for-Authority**: Companies must stake 1,000 $AV to become "Authorized Reporters," creating a financial bond for accuracy.
- **Community Voting**: Distributed weighted voting for protocol parameters, whitelist/blacklist thresholds, and entity admissions.
- **Revenue Sharing**: Automated collection of protocol fees (from score access) redistributed to active DAO participants.

### 4. Cross-Chain Reputation Bridge
- **Global Mobility**: Sync reputation scores between Ethereum Sepolia, Polygon Amoy, and Arbitrum.
- **Relayer Network**: Cryptographically signed proofs are relayed across chains to ensure a user's AV history follows them into new ecosystems.

### 5. Advanced Privacy Portal
- **Homomorphic Encryption**: Uses the Paillier cryptosystem to aggregate reputation impacts. Impacts are summed in their encrypted state, ensuring even the server cannot see individual report values during calculation.

---

## 💻 Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Blockchain** | Solidity, Truffle, Web3.js |
| **ZK-Privacy** | Circom, SnarkJS, Groth16 |
| **AI/Backend** | Node.js, Express, Socket.IO |
| **Frontend** | React 19, Tailwind CSS, Vite |
| **Storage** | IPFS (Pinata), Ganache (Local Dev) |
| **Cryptography** | AES-256, Paillier-BigInt, EIP-712 |

---

## 🏗️ System Architecture

1.  **User Layer**: Interacts via MetaMask, signs transactions, and generates ZK proofs locally.
2.  **Service Layer (Backend)**: Orchestrates AI scoring, handles the Bridge relayer, and serves as an API gateway.
3.  **Data Layer (Blockchain)**: Immutable logs for transactions, reports, and identity metadata CIDs.
4.  **Verification Layer**: Decentralized set of Authorities (Staked via DAO) providing external reputation signals.

---

## 🛡️ Security Posture
- **Zero-DB reliance**: Recovery of full system state possible entirely from on-chain event logs.
- **Client-Side Crypto**: No private keys or unencrypted PII ever transmitted to the server.
- **DAO Guard**: Critical threshold changes require community consensus, preventing "Admin-in-the-middle" attacks.

