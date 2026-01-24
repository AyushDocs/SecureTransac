import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getNonce, searchAddress, verifySignature } from "../api/client";

// Network Configurations
const NETWORKS = {
  sepolia: {
    chainId: '0xaa36a7', // 11155111
    chainName: 'Sepolia Testnet',
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/']
  },
  amoy: {
    chainId: '0x13882', // 80002
    chainName: 'Polygon Amoy',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    blockExplorerUrls: ['https://amoy.polygonscan.com/']
  },
  localhost: {
    chainId: '0x539', // 1337
    chainName: 'Localhost',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['http://127.0.0.1:7545'],
  }
};

// Supported wallet providers
const WALLET_PROVIDERS = {
  metamask: { name: 'MetaMask', icon: '🦊' },
  coinbase: { name: 'Coinbase Wallet', icon: '🔵' },
  walletconnect: { name: 'WalletConnect', icon: '🔗' },
  phantom: { name: 'Phantom', icon: '👻' },
  injected: { name: 'Browser Wallet', icon: '🌐' }
};

// Role to dashboard path mapping
const ROLE_DASHBOARD_MAP = {
  'admin': '/dashboard',
  'deployer': '/dashboard',
  'creator': '/dashboard',
  'company': '/dashboard',
  'viewer': '/dashboard',
  'user': '/dashboard'
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Hydrate state from localStorage for persistent sessions
  const [role, setRole] = useState(localStorage.getItem("userRole"));
  const [roles, setRoles] = useState(() => {
    const stored = localStorage.getItem("userRoles");
    return stored ? JSON.parse(stored) : [];
  });
  const [activeRole, setActiveRole] = useState(localStorage.getItem("activeRole"));
  const [address, setAddress] = useState(localStorage.getItem("userAddress"));
  const [token, setToken] = useState(localStorage.getItem("userToken"));
  const [profile, setProfile] = useState(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [showDashboardSelector, setShowDashboardSelector] = useState(false);
  
  // Multi-wallet support
  const [walletProvider, setWalletProvider] = useState(localStorage.getItem("walletProvider") || null);
  const [useWeb3Modal, setUseWeb3Modal] = useState(true); // Enable Web3Modal by default

  // Load initial chain ID and listen for changes
  useEffect(() => {
        window.ethereum.request({ method: 'eth_chainId' })
            .then(id => {
                console.log("[AuthContext] Initial Chain ID detected:", id);
                setChainId(id);
            })
            .catch(console.error);

        const handleChainChanged = (newChainId) => {
            console.log("[AuthContext] Chain changed to:", newChainId);
            setChainId(newChainId);
        };

        const handleAccountsChanged = async (accounts) => {
            if (accounts.length > 0) {
                console.log("[AuthContext] Account changed to:", accounts[0]);
                const newAddress = accounts[0];
                
                // If the account changed from what we have stored, clear session
                if (newAddress.toLowerCase() !== address?.toLowerCase()) {
                    setAddress(newAddress);
                    setProfile(null);
                    setRole(null);
                    setRoles([]);
                    setActiveRole(null);
                    setToken(null);
                    localStorage.removeItem("userToken");
                    localStorage.removeItem("userRoles");
                    localStorage.removeItem("activeRole");
                }
            } else {
                console.log("[AuthContext] Accounts disconnected");
                logout();
            }
        };

        window.ethereum.on('chainChanged', handleChainChanged);
        window.ethereum.on('accountsChanged', handleAccountsChanged);

        // Auto-Connect Logic
        const attemptAutoConnect = async () => {
            const isManualLogout = localStorage.getItem("manualLogout") === "true";
            if (isManualLogout) {
                console.log("[AuthContext] Skipping auto-connect due to manual logout");
                return;
            }

            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    console.log("[AuthContext] Auto-connecting to:", accounts[0]);
                    setAddress(accounts[0]);
                    localStorage.setItem("userAddress", accounts[0]);
                    
                    // Restore session from storage
                    const savedToken = localStorage.getItem("userToken");
                    const savedAddress = localStorage.getItem("userAddress");
                    const savedRoles = localStorage.getItem("userRoles");
                    const savedActiveRole = localStorage.getItem("activeRole");
                    
                    if (savedToken && savedAddress?.toLowerCase() === accounts[0].toLowerCase()) {
                        setToken(savedToken);
                        if (savedRoles) setRoles(JSON.parse(savedRoles));
                        if (savedActiveRole) {
                            setActiveRole(savedActiveRole);
                            setRole(savedActiveRole);
                        }
                        console.log("[AuthContext] Session restored from storage");
                    }
                }
            } catch (err) {
                console.error("[AuthContext] Auto-connect failed", err);
            }
        };

        attemptAutoConnect();
        
        return () => {
            if (window.ethereum.removeListener) {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!address) {
        setProfile(null);
        return;
      }
      try {
        const data = await searchAddress(address);
        setProfile(data);
        // Don't override role from profile if we have RBAC roles
        if (data.role && roles.length === 0) {
          setRole(data.role);
          localStorage.setItem("userRole", data.role);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    }
    loadProfile();
  }, [address]);

  const user = useMemo(() => {
    if (address) {
      return {
        address,
        role: activeRole || role || 'user',
        roles: roles.length > 0 ? roles : [role || 'user'],
        activeRole: activeRole || role || 'user',
        name: (activeRole || role || 'User').charAt(0).toUpperCase() + (activeRole || role || 'User').slice(1),
        ...profile
      };
    }
    return null;
  }, [address, role, roles, activeRole, profile]);

  const login = useCallback((selectedRole, selectedAddress) => {
    setRole(selectedRole);
    setActiveRole(selectedRole);
    setAddress(selectedAddress);
  }, []);

  // Switch active role/dashboard without re-authenticating
  const switchRole = useCallback(async (newRole) => {
    if (!roles.includes(newRole)) {
      throw new Error(`You don't have the ${newRole} role`);
    }
    
    try {
      // Optionally sync with backend
      const response = await fetch('http://localhost:5000/api/admin/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to switch role');
      }
      
      setActiveRole(newRole);
      setRole(newRole);
      localStorage.setItem("activeRole", newRole);
      localStorage.setItem("userRole", newRole);
      
      console.log("[AuthContext] Switched to role:", newRole);
      return true;
    } catch (error) {
      console.error("[AuthContext] Role switch failed:", error);
      // Fallback: switch locally even if backend fails
      setActiveRole(newRole);
      setRole(newRole);
      localStorage.setItem("activeRole", newRole);
      localStorage.setItem("userRole", newRole);
      return true;
    }
  }, [roles, token]);

  const switchNetwork = useCallback(async (networkKey) => {
    const network = NETWORKS[networkKey];
    if (!network) throw new Error("Invalid network key");

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: network.chainId }],
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [network],
                });
            } catch (addError) {
                console.error("Failed to add network:", addError);
                throw addError;
            }
        } else {
            console.error("Failed to switch network:", switchError);
            throw switchError;
        }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined") return null;

    console.log("Checking for Ethereum provider...", { 
      ethereum: window.ethereum, 
      isMetaMask: window.ethereum?.isMetaMask,
      web3: typeof window.web3 !== "undefined"
    });

    let provider = window.ethereum;

    if (!provider && typeof window.web3 !== "undefined") {
      provider = window.web3.currentProvider;
    }

    if (!provider) {
      alert("No Ethereum wallet detected. If you just installed MetaMask, please refresh the page.");
      return null;
    }

    setIsWalletConnecting(true);
    try {
      if (provider.providers) {
        provider = provider.providers.find(p => p.isMetaMask) || provider.providers[0];
      }

      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const walletAddress = accounts[0];
      
      const cid = await provider.request({ method: 'eth_chainId' });
      setChainId(cid);

      console.log("Requesting nonce for", walletAddress);
      const { nonce } = await getNonce(walletAddress);
      
      console.log("Requesting signature for challenge:", nonce);
      const signature = await provider.request({
        method: "personal_sign",
        params: [nonce, walletAddress],
      });

      console.log("Verifying signature on backend...");
      const authResult = await verifySignature(walletAddress, signature);

      if (authResult.success) {
        setAddress(walletAddress);
        setToken(authResult.token);
        
        localStorage.setItem("userAddress", walletAddress);
        localStorage.setItem("userToken", authResult.token);
        localStorage.removeItem("manualLogout");

        // Handle RBAC roles from auth response
        const userRoles = authResult.roles || authResult.user?.roles || [authResult.user?.role || 'user'];
        const userActiveRole = authResult.activeRole || authResult.user?.activeRole || userRoles[0];
        
        setRoles(userRoles);
        setActiveRole(userActiveRole);
        setRole(userActiveRole);
        
        localStorage.setItem("userRoles", JSON.stringify(userRoles));
        localStorage.setItem("activeRole", userActiveRole);
        localStorage.setItem("userRole", userActiveRole);

        console.log("[AuthContext] Authenticated with roles:", userRoles);

        // Show dashboard selector if user has multiple roles
        if (userRoles.length > 1) {
          setShowDashboardSelector(true);
        }

        return walletAddress;
      } else {
        throw new Error("Authentication failed: Invalid signature");
      }
    } catch (error) {
      console.error("Wallet connection/auth failed", error);
      const msg = error.code === 4001 
        ? "Authentication rejected by user. Please sign the message to log in." 
        : (error.message || "Failed to connect to wallet.");
      alert(msg);
      return null;
    } finally {
      setIsWalletConnecting(false);
    }
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    setRoles([]);
    setActiveRole(null);
    setAddress(null);
    setToken(null);
    setProfile(null);
    setShowDashboardSelector(false);
    localStorage.removeItem("userRole");
    localStorage.removeItem("userRoles");
    localStorage.removeItem("activeRole");
    localStorage.removeItem("userAddress");
    localStorage.removeItem("userToken");
    localStorage.setItem("manualLogout", "true");
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!address) return;
    try {
      const data = await searchAddress(address);
      setProfile(data);
      if (data.role && roles.length === 0) {
        setRole(data.role);
        localStorage.setItem("userRole", data.role);
      }
    } catch (error) {
      console.error("Failed to refresh profile", error);
    }
  }, [address, roles.length]);

  // Fetch current user info with roles from /me endpoint
  const fetchUserInfo = useCallback(async () => {
    if (!token) return null;
    
    try {
      const response = await fetch('http://localhost:5000/api/admin/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
        setActiveRole(data.activeRole);
        localStorage.setItem("userRoles", JSON.stringify(data.roles));
        localStorage.setItem("activeRole", data.activeRole);
        return data;
      }
    } catch (error) {
      console.error("[AuthContext] Failed to fetch user info:", error);
    }
    return null;
  }, [token]);

  // Check if user has a specific role
  const hasRole = useCallback((requiredRole) => {
    return roles.includes(requiredRole);
  }, [roles]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((requiredRoles) => {
    return requiredRoles.some(r => roles.includes(r));
  }, [roles]);

  const value = useMemo(() => ({
    user,
    role,
    roles,
    activeRole,
    address,
    token,
    chainId,
    login,
    logout,
    connectWallet,
    switchNetwork,
    switchRole,
    refreshProfile,
    fetchUserInfo,
    hasRole,
    hasAnyRole,
    isWalletConnecting,
    showDashboardSelector,
    setShowDashboardSelector,
    isAdmin: role === "admin" || role === "deployer",
    isMultiRole: roles.length > 1,
    availableNetworks: NETWORKS,
    ROLE_DASHBOARD_MAP
  }), [user, role, roles, activeRole, address, token, chainId, login, logout, connectWallet, switchNetwork, switchRole, refreshProfile, fetchUserInfo, hasRole, hasAnyRole, isWalletConnecting, showDashboardSelector]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
