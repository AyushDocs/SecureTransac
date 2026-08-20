/**
 * Test Setup File
 * Configures test environment and provides common mocks
 */
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

// Mock Web3Context so components using useWeb3 render without wagmi/web3modal.
// The real provider spins up WagmiProvider + Web3Modal, which jsdom can't mount.
vi.mock('../context/Web3Context', () => ({
  useWeb3: () => ({
    address: '0x1234567890abcdef1234567890abcdef12345678',
    isConnected: false,
    chainId: null,
    token: null,
    walletName: null,
    openWalletModal: vi.fn(),
    disconnect: vi.fn(),
    authenticate: vi.fn(),
  }),
  Web3Provider: ({ children }) => children,
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.alert
window.alert = vi.fn();

// Mock window.confirm
window.confirm = vi.fn(() => true);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Web3/Ethereum
window.ethereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  isMetaMask: true,
};

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = MockResizeObserver;
