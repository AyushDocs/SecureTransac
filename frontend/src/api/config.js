// Backend and Contract Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const CONTRACT_ADDRESSES = {
  TrustRegistry: import.meta.env.VITE_TRUST_REGISTRY_TRUST_REGISTRY_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  IdentityVault: import.meta.env.VITE_IDENTITY_VAULT_ADDRESS || "0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8",
  VerificationRegistry: import.meta.env.VITE_VERIFICATION_REGISTRY_ADDRESS || "0x851356ae760d987E095750cCeb3bC6014560891C",
  SecureTransacSBT: "0x998abeb3E57409262aE5b751f60747921B33613E", // Updated to current deployment
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
    "inputs": [
      {"internalType": "address", "name": "_contractAddress", "type": "address"},
      {"internalType": "uint256", "name": "_minScore", "type": "uint256"}
    ],
    "name": "setContractThreshold",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "contractMaintainer",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_maintainer", "type": "address"}],
    "name": "getContractsByMaintainer",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
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
