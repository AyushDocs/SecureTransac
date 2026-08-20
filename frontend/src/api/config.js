// Backend and Contract Configuration
import { CONTRACT_ADDRESSES as DEPLOYED_ADDRESSES } from "./contractAddresses.generated";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Resolve the socket endpoint. Same-origin (via nginx/Vite proxy) is preferred in
// deployment; an explicit VITE_SOCKET_URL always wins.
export const SOCKET_URL = (() => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  const api = import.meta.env.VITE_API_BASE_URL;
  if (api && /^https?:\/\//i.test(api)) {
    const host = api.replace(/\/api$/i, "").replace(/\/$/, "");
    if (typeof window === "undefined") return host;
    return host || window.location.origin;
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:5000";
})();
// Addresses are kept in sync automatically by `npm run sync` in /onchain
// (generated from onchain/build/contracts). Env vars still override for prod/testnet.
export const CONTRACT_ADDRESSES = {
  TrustRegistry: import.meta.env.VITE_TRUST_REGISTRY_TRUST_REGISTRY_ADDRESS || DEPLOYED_ADDRESSES.TrustRegistry,
  IdentityVault: import.meta.env.VITE_IDENTITY_VAULT_ADDRESS || DEPLOYED_ADDRESSES.IdentityVault,
  VerificationRegistry: import.meta.env.VITE_VERIFICATION_REGISTRY_ADDRESS || DEPLOYED_ADDRESSES.VerificationRegistry,
  TrustDAO: DEPLOYED_ADDRESSES.TrustDAO,
  SoulBoundToken: DEPLOYED_ADDRESSES.SoulBoundToken,
  TransactionLogger: DEPLOYED_ADDRESSES.TransactionLogger,
  AVToken: import.meta.env.VITE_AV_TOKEN_ADDRESS || DEPLOYED_ADDRESSES.AVToken
};

export const TRUST_REGISTRY_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getScore",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "whitelistThreshold",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "blacklistThreshold",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_whitelistThreshold", "type": "uint256"},
      {"internalType": "uint256", "name": "_blacklistThreshold", "type": "uint256"}
    ],
    "name": "setThresholds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "credits",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "target", "type": "address"}],
    "name": "accessScore",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "target", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "score", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "viewer", "type": "address"}
    ],
    "name": "ScoreRevealed",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "reporter", "type": "address" },
      { "internalType": "bool", "name": "status", "type": "bool" }
    ],
    "name": "setReporterStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const IDENTITY_VAULT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "authority", "type": "address" },
      { "internalType": "bool", "name": "status", "type": "bool" }
    ],
    "name": "setAuthorityStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "isAuthorizedAuthority",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_ipfsHash", "type": "string" }
    ],
    "name": "storeData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "requestData",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
export const ERC721S_ABI = [
  {
    "inputs": [],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
