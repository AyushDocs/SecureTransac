# Project Map

This document provides an overview of the SecureTransac project structure and where key facilities are located.

## 🗺️ High-Level Structure

```text
/
├── .github/                # GitHub-specific configs and AI instructions
├── frontend/               # React Frontend Application
├── server/                 # Express Backend API Server
├── onchain/                # Solidity Smart Contracts (Truffle)
├── demo-vulnerable/        # Security Showcase (Vulnerable vs Protected)
└── data/                   # (Server-side) Persistent JSON storage
```

## 🖥️ Frontend Facilities (`/frontend`)
- **API Client**: [client.js](file:///j:/Users/ayush/Desktop/code/Pecathon/frontend/src/api/client.js) - All Web3 and Backend communication.
- **Pages**: `/src/pages` - Dashboard, Address Profile, Identity Vault.
- **Components**: `/src/components` - Reusable UI elements like the Score Gauge and Audit Timeline.
- **Context**: `/src/context` - Auth and global state management.

## ⚙️ Backend Facilities (`/server`)
- **API Routes**: `/src/routes` - Admin and user endpoints.
- **Controllers**: `/src/controllers` - Logic for processing reports, transactions, and analytics.
- **Services**: `/src/services`
  - [aiService.js](file:///j:/Users/ayush/Desktop/code/Pecathon/server/src/services/aiService.js): The core algorithm for trust scoring.
  - [web3Service.js](file:///j:/Users/ayush/Desktop/code/Pecathon/server/src/services/web3Service.js): Handles syncing scores to the blockchain.
  - [persistenceService.js](file:///j:/Users/ayush/Desktop/code/Pecathon/server/src/services/persistenceService.js): Simple JSON-based DB layer.

## ⛓️ On-Chain Facilities (`/onchain`)
- **Contracts**: `/contracts`
  - `TrustRegistry.sol`: Stores user trust scores and risk categories.
  - `IdentityVault.sol`: Encrypted identity data storage.
  - `Guardian.sol`: Access control layer for other contracts.
- **Migrations**: `/migrations` - Deployment scripts.
- **DB (Local)**: `/ganache_db` - Persistent state for the local Ganache chain.

## 🔐 Security Showcase (`/demo-vulnerable`)
- **VULNERABLE**: `contracts/VulnerableBank.sol` - Demonstrates reentrancy and lack of access control.
- **PROTECTED**: `contracts/ProtectedBank.sol` - Uses SecureTransac's `Guardian` to block malicious actors.
