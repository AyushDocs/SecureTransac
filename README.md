# 🛡️ SecureTransac

**A Decentralized Reputation & Identity Layer for the Ethereum Ecosystem.**

SecureTransac leverages **On-Chain AI**, **Zero-Knowledge Proofs**, and **Social Graph Analysis** to create a transparent, privacy-preserving AV system for Web3. It protects smart contracts from malicious actors by assigning dynamic "AV Scores" to every wallet address based on their behavior and associations.

---

## 🚀 Key Features

### 🧠 AI-Driven AV Scoring
-   **Real Fraud Model**: A neural network trained on 9,841 real Ethereum addresses (public fraud-labeled dataset) predicts fraud probability from on-chain behavior — no synthetic data. See **[ai/README.md](./ai/README.md)**.
-   **On-Chain Features**: Volume, transaction frequency, account age, network degree, temporal cadence, value flows, and volatility — all computed from blockchain event logs.
-   **Temporal Analysis**: Detects anomalies like sudden transaction bursts (bot activity) or volume spikes (hacked wallets).
-   **On-Chain Source of Truth**: All behavioral data is fetched directly from the blockchain event logs, not a centralized database.

### 🔐 Privacy-First Identity
-   **ZK-Proofs (Circom)**: Users can prove their "Verified" status to third parties without revealing their underlying identity metadata.
-   **Identity Vault**: Encrypted user data (names, emails) is stored on IPFS, accessible only via approved "Authority" requests.

### ⚡ Real-Time & Scalable
-   **Live Activity Feed**: Real-time WebSocket updates for all on-chain transactions and reports.
-   **Redis Caching**: A simulated Redis layer (via `node-cache`) reduces RPC load by 90% for high-frequency score lookups.
-   **Gas Optimized**: Smart contracts utilize struct packing and event-driven storage to minimize gas costs by ~40%.

### 🛡️ Guardian Layer
-   **Protection**: Smart contracts can inherit `Guardian.sol` and use the `onlyTrusted` modifier to automatically block low-score addresses.
-   **Vulnerable Demo**: Includes a showcase demonstrating how SecureTransac mitigates reentrancy and other common attacks.

---

## 📂 Project Structure

For a detailed map, see **[PROJECT_MAP.md](./PROJECT_MAP.md)**.

```text
/ai               - ML Fraud Model (real Ethereum dataset) + training notebooks
/onchain           - Solidity Smart Contracts & ZK Circuits
  /contracts       - TrustRegistry, VerificationRegistry, ZKIdentityVerifier
  /zk              - identity.circom (Zero-Knowledge Circuit)
/server            - Node.js Backend (AI Engine, Web3 Sync, Caching)
  /src/services    - Logic for Scoring, Persistence, and Real-time Sockets
/frontend          - React/Vite DApp (Decentralized, IPFS-ready)
/demo-vulnerable   - Security comparison demo
```

---

## 🛠️ Installation & Setup

### Prerequisites
-   Node.js (v18+)
-   Truffle & Ganache (or Hardhat/Anvil)
-   MetaMask

### 1. Smart Contracts & ZK
```bash
cd onchain
npm install
# Compile Contracts & Circuits
truffle compile
# Deploy to Local Network
truffle migrate --reset --network development
```

### 2. Backend Server
```bash
cd server
npm install
# Ensure .env is configured with CONTRACT_ADDRESSES from the migration output
npm run dev
```

### 3. Frontend DApp
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing

### Backend & AI Logic
Run the comprehensive API and AI logic test suite:
```bash
cd server
npm test
```

### Smart Contracts
Run Truffle integration tests:
```bash
cd onchain
truffle test
```

---

## 📖 Deployment (IPFS)

The frontend is fully decentralized and ready for IPFS hosting.
See **[DEPLOY_IPFS.md](./DEPLOY_IPFS.md)** for detailed instructions on deploying to Fleek, Pinata, or local nodes.

---

## 🤝 Community & Security

-   **[License](./LICENSE)**: MIT License.
-   **[Code of Conduct](./CODE_OF_CONDUCT.md)**: Fostering a welcoming environment.
-   **[Security Policy](./SECURITY.md)**: Report vulnerabilities to security@securetransac.io.

---
Built for the **Pecathon Hackathon**.  
*Secure your code, secure the future.*

