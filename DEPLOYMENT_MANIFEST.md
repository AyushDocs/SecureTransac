# 🚀 SecureTransac: Deployment Manifest

This document provides the exact sequence of operations required to deploy the full SecureTransac ecosystem to a production or staging environment.

---

## 📋 Prerequisites
1.  **Node.js**: v18+
2.  **MetaMask**: Configured for target network (Sepolia/Amoy).
3.  **Ethereum Provider**: Infura/Alchemy URL or local Ganache.
4.  **IPFS Credentials**: Pinata API Key and Secret.
5.  **ZK Tools**: `circom` and `snarkjs` installed globally.

---

## ⛓️ Step 1: On-Chain Deployment (Contracts)

Navigate to the `onchain` directory and configure `.env`:
```bash
# onchain/.env
PRIVATE_KEY="your_deployment_account_private_key"
INFURA_PROJECT_ID="your_infura_id"
```

Run the deployment migrations:
```bash
truffle migrate --network sepolia
```

**Order of Deployment:**
1.  `AccessControl` (Library/Base)
2.  `TrustRegistry` (Main Score Hub)
3.  `IdentityVault` (CID Storage)
4.  `VerificationRegistry` (Entity Approvals)
5.  `SecureTransacToken` ($AV Governance)
6.  `TrustDAO` (Staking and Voting)
7.  `ZKScoreVerifier` (Groth16 Verifier for SNARKs)

---

## 🕵️ Step 2: ZK Circuit Preparation

Generate the proving and verification keys for client-side privacy:
```bash
cd zk
sh generate_zk_proofs.sh
```
**Required Artifacts for Frontend:**
- `build/trust_score_verifier.wasm` -> `frontend/public/zk/`
- `build/trust_score_verifier_final.zkey` -> `frontend/public/zk/`
- `build/verification_key.json` -> `frontend/public/zk/`

---

## ⚙️ Step 3: Backend Setup (Server)

Configure the environment in the `server` directory:
```bash
# server/.env
PORT=5000
PROVIDER_URL="https://sepolia.infura.io/v3/..."
REGISTRY_ADDRESS="0x..."
VAULT_ADDRESS="0x..."
ADMIN_PRIVATE_KEY="0x..."
PINATA_API_KEY="..."
PINATA_SECRET_KEY="..."
JWT_SECRET="generate_a_random_string"
```

Start the service:
```bash
npm install
npm run start
```

---

## 🎨 Step 4: Frontend Build (Client)

Configure Vite environment variables:
```bash
# frontend/.env
VITE_API_BASE_URL="https://your-api-domain.com/api/admin"
VITE_TRUST_REGISTRY_ADDRESS="0x..."
VITE_IDENTITY_VAULT_ADDRESS="0x..."
VITE_NETWORK_ID=11155111
```

Build for standard hosting or IPFS:
```bash
npm install
npm run build
```
*The resulting `dist/` folder is ready for deployment to Vercel, Netlify, or IPFS (via `DEPLOY_IPFS.md`).*

---

## ✅ Deployment Checklist
- [ ] Contract addresses updated in `frontend/src/api/config.js`
- [ ] Admin backend key has enough ETH for gas (Relayer/Bridge).
- [ ] ZK artifacts correctly placed in `public/zk`.
- [ ] Caching layer (internal cache) warmed up by initial log scan.
- [ ] Socket.IO CORS configured to match frontend domain.

