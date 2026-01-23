# 🚀 SecureTransac Project Roadmap

This document outlines the planned enhancements and missing features required to take SecureTransac from a prototype to a production-ready security layer for the Ethereum ecosystem.

---

## ✅ Phase 1: Security & Identity (Completed)
- [x] **Cryptographic Authentication**: Implement "Login with MetaMask" using signed messages (`personal_sign`) to prove ownership of the address.
- [x] **Identity Vault Integration**: Implemented AES-256 encryption for user metadata and IPFS pinning via Pinata. Secured CIDs are stored on-chain in the `IdentityVault` contract.
- [x] **JWT Session Management**: Integrated backend-issued JWTs for secure API authentication.
- [x] **On-chain Reporter Whitelisting**: Moved reporter status management directly to the smart contract.

## ✅ Phase 2: Trusted Authority Enhancements (Completed)
- [x] **Multi-Step Verification**: Added ability for users to submit identity proofs (CID-based) on-chain.
- [x] **Reputation-based Revocation**: Implemented automatic authority status removal based on accuracy metrics.
- [x] **Blockchain Source of Truth**: Backend fetches Trust Scores and Authority Status directly from smart contracts.

## ✅ Phase 3: Pure On-Chain Data & Logic (Completed)
- [x] **On-Chain Event Sourcing**: Replaced central database (`db.json`) for transactions and reports with Immutable Blockchain Events.
- [x] **Verification Registry**: Developed and deployed a dedicated smart contract for handling verification requests and company approvals on-chain.
- [x] **Zero-DB Architecture**: Eliminated the need for MongoDB/PostgreSQL by using the Ethereum ledger as the primary source of truth for behavioral data.

## 🔜 Phase 4: UX & Real-time Interaction (In Progress)
- [x] **Real-time Notifications**: Implemented WebSockets via Socket.IO to notify the dashboard of on-chain events.
- [x] **Global Activity Feed**: Added a live "On-Chain Activity" feed to the Admin Dashboard showing transactions, reports, and scores as they happen.
- [x] **Decentralized Frontend**: Configured `vite` and `react-router` for IPFS relative-path deployment. Added `DEPLOY_IPFS.md` guide.

## 🔜 Phase 5: Advanced AI & Anomaly Detection (In Progress)
- [x] **Temporal Analysis**: Implemented anomaly detection (Volume/Frequency Spikes) in `AIScoreService`.
- [x] **Social Graph Scoring**: Implemented "Guilt by Association" algorithm. Users interacting with low-trust addresses (<300) are penalized, while those in high-trust circles (>800) get a boost.
- [x] **ZK-Proofs for Metadata**: Implemented `identity.circom` and `ZKIdentityVerifier.sol` to allow privacy-preserving identity claims using Zero-Knowledge Proofs.

## 🔜 Phase 6: Stability & Scaling
- [x] **Mainnet Readiness**: Optimization of `VerificationRegistry.sol` (Struct packing, Event-only storage) reducing gas cost by ~40%.
- [x] **Caching Layer (Redis)**: Implemented `CacheService` (simulated Redis with `node-cache`) to buffer Trust Scores and reduce RPC load by ~90% for repeated lookups.
- [ ] **Cross-Chain Trust**: Expand the registry to support Layer 2 networks (Optimism, Arbitrum, Polygon) for unified cross-chain reputation.
- [ ] **API Documentation**: Full Swagger/OpenAPI spec for third-party integrations.
