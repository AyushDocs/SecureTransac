// Backend and Contract Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/admin";

export const CONTRACT_ADDRESSES = {
  TrustRegistry: import.meta.env.VITE_TRUST_REGISTRY_TRUST_REGISTRY_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  IdentityVault: import.meta.env.VITE_IDENTITY_VAULT_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
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
  }
];
