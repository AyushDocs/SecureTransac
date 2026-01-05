# SecureTransac

SecureTransac is a sophisticated security infrastructure layer for blockchain applications. It leverages AI-driven trust scoring and on-chain modifiers to protect smart contracts from malicious actors and provide a robust identity verification mechanism.

## 🚀 Key Features

- **AI-Driven Trust Scoring**: Automatically calculates and updates trust scores based on transactional behavior and community reports.
- **On-Chain Protection (Guardian Layer)**: A Solidity abstract contract providing modifiers (`onlyTrusted`) to safeguard any function from low-trust addresses.
- **Identity Vault**: A secure storage for encrypted user data, accessible only by authorized authorities.
- **Real-Time Analytics**: An Express backend providing global security metrics and detailed user risk profiles.
- **Dynamic Blacklisting/Whitelisting**: Automated on-chain list management triggered by AI evaluations.
- **Vulnerable Demo Showcase**: A practical example demonstrating how logical errors in smart contracts (like reentrancy) can be mitigated using SecureTransac.

## 📂 Project Structure

```text
/onchain           - Core Smart Contracts (Truffle)
  /contracts       - TrustRegistry, IdentityVault, Guardian logic
/server            - Production-Grade Express Backend (Node.js)
  /src/services    - Web3 Sync, AI Scoring Engine, Persistence
  /src/controllers - Admin & Security Logic
/demo-vulnerable   - Security comparison demo (Vulnerable vs Protected)
/temp_archive_folder - Backup/Archive utilities
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- Truffle & Ganache
- MetaMask (for on-chain interaction)

### 1. Smart Contracts (onchain)
```bash
cd onchain
npm install
truffle compile
truffle migrate --network development
```

### 2. Backend Server (server)
```bash
cd server
npm install
# Configure .env with your Ganache/Provider details
npm start
```

### 3. Vulnerable Demo
```bash
cd demo-vulnerable
npm install
truffle test
```

## 🧪 Testing

### Backend Testing
Run the comprehensive API test suite using Mocha:
```bash
cd server
npm test
```

### Smart Contract Testing
Run Truffle integration tests:
```bash
cd onchain
truffle test
```

## 📖 Usage Guide

1.  **Integrate the Guardian**: Have your smart contract inherit from `Guardian.sol`.
2.  **Protect Functions**: Add the `onlyTrusted` modifier to sensitive functions.
3.  **Feed the AI**: Send transactional logs or textual reports to the backend `/api/admin/transaction` or `/api/admin/report`.
4.  **Automated Security**: The AI will re-evaluate the user's score and update the `TrustRegistry` on-chain, automatically blocking bad actors from your contract.

## 🛡️ Future Roadmap
- [ ] ZK-Proof identity verification.
- [ ] Cross-chain registry synchronization (CCIP).
- [ ] DAO-based governance for blacklist appeals.
- [ ] Automated threat simulation for developers.

---
Built for the Pecathon hackathon. Secure your code, secure the future.
