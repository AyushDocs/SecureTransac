/**
 * Web3 Context - Multi-Wallet Provider Support
 * Integrates with Web3Modal/wagmi for MetaMask, Coinbase, Phantom, WalletConnect
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAccount, useChainId, useDisconnect, useSignMessage, useSwitchChain, WagmiProvider } from 'wagmi';
import { getNonce, verifySignature } from '../api/client';
import { initWeb3Modal, wagmiConfig } from '../config/web3Config';

// Initialize Web3Modal
initWeb3Modal();

// Query client for react-query
const queryClient = new QueryClient();

const Web3Context = createContext(null);

/**
 * Inner Web3 Provider with hooks
 */
function Web3ProviderInner({ children }) {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { open: openWeb3Modal, close: closeWeb3Modal } = useWeb3Modal();

  const [token, setToken] = useState(localStorage.getItem('userToken'));
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [walletName, setWalletName] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Get wallet name from connector
  useEffect(() => {
    if (connector) {
      setWalletName(connector.name);
    }
  }, [connector]);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (isConnected && address && !token) {
      // User connected but not authenticated - prompt for signature
      console.log('[Web3Context] Wallet connected, requesting authentication...');
    }
  }, [isConnected, address, token]);

  /**
   * Open wallet selector modal
   */
  const openWalletModal = useCallback(() => {
    openWeb3Modal();
  }, [openWeb3Modal]);

  /**
   * Authenticate with backend using signature
   */
  const authenticate = useCallback(async () => {
    if (!address) {
      throw new Error('No wallet connected');
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Get nonce from backend
      const { nonce } = await getNonce(address);
      
      // Request signature from wallet
      const signature = await signMessageAsync({ message: nonce });
      
      // Verify with backend
      const authResult = await verifySignature(address, signature);

      if (authResult.success) {
        setToken(authResult.token);
        localStorage.setItem('userToken', authResult.token);
        localStorage.setItem('userAddress', address);
        localStorage.removeItem('manualLogout');

        console.log('[Web3Context] Authentication successful');
        return authResult;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('[Web3Context] Authentication failed:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, signMessageAsync]);

  /**
   * Full connect + authenticate flow
   */
  const connectAndAuth = useCallback(async () => {
    if (!isConnected) {
      // Open modal to connect
      await openWeb3Modal();
      return null; // User will need to select wallet
    }
    
    // Already connected, authenticate
    return await authenticate();
  }, [isConnected, openWeb3Modal, authenticate]);

  /**
   * Disconnect and clear auth
   */
  const disconnectWallet = useCallback(() => {
    disconnect();
    setToken(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userAddress');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('activeRole');
    localStorage.setItem('manualLogout', 'true');
    console.log('[Web3Context] Disconnected');
  }, [disconnect]);

  /**
   * Switch network
   */
  const switchNetwork = useCallback(async (chainIdToSwitch) => {
    try {
      await switchChain({ chainId: chainIdToSwitch });
    } catch (error) {
      console.error('[Web3Context] Failed to switch network:', error);
      throw error;
    }
  }, [switchChain]);

  const value = {
    // Connection state
    address,
    isConnected,
    chainId,
    walletName,
    connector,
    
    // Auth state
    token,
    isAuthenticating,
    authError,
    isAuthenticated: !!token && isConnected,
    
    // Actions
    openWalletModal,
    authenticate,
    connectAndAuth,
    disconnect: disconnectWallet,
    switchNetwork,
    
    // Modal control
    closeModal: closeWeb3Modal,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

/**
 * Web3 Provider with wagmi and react-query
 */
export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Web3ProviderInner>
          {children}
        </Web3ProviderInner>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

/**
 * Hook to use Web3 context
 */
export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

export default Web3Provider;
