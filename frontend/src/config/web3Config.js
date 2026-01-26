/**
 * Web3 Configuration for Multi-Wallet Support
 * Supports: MetaMask, Coinbase Wallet, WalletConnect, Phantom, and more
 */
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { mainnet, polygon, polygonAmoy, sepolia } from 'wagmi/chains';

// Custom Ganache/Localhost chain
const localhost = {
  id: 1337,
  name: 'Ganache Local',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:7545'] },
  },
};

// Project ID from WalletConnect Cloud (get one free at https://cloud.walletconnect.com)
// Using a public demo ID - replace with your own for production
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// Metadata for your dApp
const metadata = {
  name: 'SecureTransac',
  description: 'Decentralized Trust Scoring & Identity Verification Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://securetransac.io',
  icons: ['/pwa-192x192.png']
};

// Supported chains
const chains = [localhost, sepolia, polygonAmoy, mainnet, polygon];

// Create wagmi config
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableInjected: true, // MetaMask, Coinbase, Phantom (EVM mode)
  enableCoinbase: true, // Coinbase Wallet
  enableWalletConnect: true, // WalletConnect (mobile wallets)
  enableEIP6963: true, // Auto-detect injected wallets
});

// Initialize Web3Modal (called once in app root)
export function initWeb3Modal() {
  createWeb3Modal({
    wagmiConfig,
    projectId,
    chains,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#06b6d4', // Cyan to match app theme
      '--w3m-border-radius-master': '12px',
    },
    featuredWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Phantom
    ],
    includeWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Phantom
      '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
      '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f', // Safe
    ],
    enableAnalytics: false, // Disable analytics for privacy
    enableOnramp: false, // Disable onramp to reduce API calls
    enableSwaps: false, // Disable swaps
  });
  
  if (projectId === 'demo-project-id') {
      console.warn("[SecureTransac] Using 'demo-project-id'. You may see 401 errors from WalletConnect RPC. This is normal until you add a valid VITE_WALLETCONNECT_PROJECT_ID in .env");
  }
}

// Wallet display info for UI
export const WALLET_INFO = {
  metamask: {
    name: 'MetaMask',
    icon: '🦊',
    color: '#F6851B',
    description: 'Connect using MetaMask browser extension'
  },
  coinbase: {
    name: 'Coinbase Wallet',
    icon: '🔵',
    color: '#0052FF',
    description: 'Connect using Coinbase Wallet'
  },
  walletconnect: {
    name: 'WalletConnect',
    icon: '🔗',
    color: '#3B99FC',
    description: 'Scan with mobile wallet'
  },
  phantom: {
    name: 'Phantom',
    icon: '👻',
    color: '#AB9FF2',
    description: 'Connect using Phantom wallet'
  },
  injected: {
    name: 'Browser Wallet',
    icon: '🌐',
    color: '#6B7280',
    description: 'Connect using detected wallet'
  }
};

export { chains };

