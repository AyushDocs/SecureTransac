import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEPLOYED_NETWORK_ID } from "../api/contractAddresses.generated";
import { getNonce, searchAddress, verifySignature } from "../api/client";
import { API_BASE_URL } from "../api/config";

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
  'company': '/dashboard',
  'viewer': '/dashboard',
  'user': '/dashboard'
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Hydrate state from localStorage for persistent sessions
  const [role, setRole] = useState(() => {
    const stored = localStorage.getItem("userRole");
    // Auto-migrate 'creator' to 'company'
    if (stored === 'creator') {
      localStorage.setItem("userRole", 'company');
      return 'company';
    }
    return stored;
  });
  const [roles, setRoles] = useState(() => {
    const stored = localStorage.getItem("userRoles");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Auto-migrate 'creator' to 'company' in roles array
    const migrated = parsed.map(r => r === 'creator' ? 'company' : r);
    if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
      localStorage.setItem("userRoles", JSON.stringify(migrated));
    }
    return migrated;
  });
  const [activeRole, setActiveRole] = useState(() => {
    const stored = localStorage.getItem("activeRole");
    // Auto-migrate 'creator' to 'company'
    if (stored === 'creator') {
      localStorage.setItem("activeRole", 'company');
      return 'company';
    }
    return stored;
  });
  const [address, setAddress] = useState(localStorage.getItem("userAddress"));
  const [token, setToken] = useState(localStorage.getItem("userToken"));
  const [profile, setProfile] = useState(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [showDashboardSelector, setShowDashboardSelector] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true); // Optimistic default
  const [networkWarning, setNetworkWarning] = useState(null);
  
  // Multi-wallet support
  const [walletProvider, setWalletProvider] = useState(localStorage.getItem("walletProvider") || null);
  const [useWeb3Modal, setUseWeb3Modal] = useState(true); // Enable Web3Modal by default

  // Dev mode grace period — avoids logout during Ganache redeployment
  const graceTimerRef = useRef(null);

  const isSupportedNetwork = useCallback((cid) => {
    if (!cid) return false;
    const num = parseInt(cid, 16) || parseInt(cid, 10);
    return num === parseInt(DEPLOYED_NETWORK_ID, 10);
  }, []);

  // Load initial chain ID and listen for changes
  useEffect(() => {
        window.ethereum.request({ method: 'eth_chainId' })
            .then(id => {
                console.log("[AuthContext] Initial Chain ID detected:", id);
                setChainId(id);
                setIsCorrectNetwork(isSupportedNetwork(id));
            })
            .catch(console.error);

        const handleChainChanged = (newChainId) => {
            console.log("[AuthContext] Chain changed to:", newChainId);
            setChainId(newChainId);

            const supported = isSupportedNetwork(newChainId);
            setIsCorrectNetwork(supported);

            if (!supported) {
                // Dev mode (localhost/1337): grace period, don't logout during redeployment
                const isDevMode = parseInt(newChainId, 16) === 1337 || parseInt(newChainId, 10) === 1337;
                if (isDevMode) {
                    console.log("[AuthContext] Dev mode chain change — keeping session, grace period active");
                    setNetworkWarning("Network temporarily unavailable — reconnecting...");
                    // Clear any existing grace timer
                    if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
                    // After 30s, clear warning if still unavailable (user must manually reconnect)
                    graceTimerRef.current = setTimeout(() => setNetworkWarning(null), 30000);
                } else {
                    // Production: wrong network — warn but don't force logout
                    setNetworkWarning("Connected to an unsupported network. Please switch to a supported network.");
                }
            } else {
                // Network is valid — clear any grace period and restore session if needed
                if (graceTimerRef.current) {
                    clearTimeout(graceTimerRef.current);
                    graceTimerRef.current = null;
                }
                setNetworkWarning(null);
                // Restore session if it was cleared during grace period
                const savedToken = localStorage.getItem("userToken");
                const savedAddress = localStorage.getItem("userAddress");
                if (savedToken && !token && savedAddress) {
                    console.log("[AuthContext] Network restored — restoring session");
                    setToken(savedToken);
                    const savedRoles = localStorage.getItem("userRoles");
                    const savedActiveRole = localStorage.getItem("activeRole");
                    if (savedRoles) setRoles(JSON.parse(savedRoles));
                    if (savedActiveRole) {
                        setActiveRole(savedActiveRole);
                        setRole(savedActiveRole);
                    }
                }
            }
        };

        const handleAccountsChanged = async (accounts) => {
            if (accounts.length > 0) {
                console.log("[AuthContext] Account changed to:", accounts[0]);
                const newAddress = accounts[0];

                // Compare against the persisted account (not the mount-time closure)
                const storedAddress = localStorage.getItem("userAddress") || "";

                // If the account changed from what we have stored, clear session fully
                if (newAddress.toLowerCase() !== storedAddress.toLowerCase()) {
                    setAddress(newAddress);
                    setProfile(null);
                    setRole(null);
                    setRoles([]);
                    setActiveRole(null);
                    setToken(null);
                    setShowDashboardSelector(false);
                    localStorage.setItem("userAddress", newAddress);
                    localStorage.removeItem("userToken");
                    localStorage.removeItem("userRole");
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
            if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
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
    const previousAddress = localStorage.getItem("userAddress") || "";
    setRole(selectedRole);
    setActiveRole(selectedRole);
    setAddress(selectedAddress);
    
    // Persist session
    localStorage.setItem("userRole", selectedRole);
    localStorage.setItem("activeRole", selectedRole);
    localStorage.setItem("userAddress", selectedAddress);

    // Update roles array WITHOUT leaking the previous account's roles:
    // a different wallet address logging in starts fresh with only its own role(s).
    setRoles(prev => {
        const isSameAccount = previousAddress.toLowerCase() === (selectedAddress || "").toLowerCase();
        const base = isSameAccount ? (Array.isArray(prev) ? prev : []) : [];
        if (!base.includes(selectedRole)) {
            base.push(selectedRole);
            localStorage.setItem("userRoles", JSON.stringify(base));
            return base;
        }
        localStorage.setItem("userRoles", JSON.stringify(base));
        return base;
    });

    setShowDashboardSelector(false); // Valid explicit login, suppress selector
  }, []);

  // Switch active role/dashboard without re-authenticating
  const switchRole = useCallback(async (newRole) => {
    const isAdmin = roles.includes('admin') || roles.includes('deployer');
    if (!roles.includes(newRole) && !isAdmin) {
      throw new Error(`You don't have the ${newRole} role`);
    }
    
    try {
      // Optionally sync with backend
      const response = await fetch(`${API_BASE_URL}/admin/switch-role`, {
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

  const connectWallet = useCallback(async (suppressSelector = false, onlyAuthenticate = false) => {
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

      // Validate network — warn if not on a supported chain
      if (!isSupportedNetwork(cid)) {
          const isDevMode = parseInt(cid, 16) === 1337 || parseInt(cid, 10) === 1337;
          if (isDevMode) {
              setNetworkWarning("Dev network temporarily unavailable — reconnecting...");
          } else {
              setNetworkWarning("Connected to an unsupported network. Please switch to a supported network.");
          }
          setIsCorrectNetwork(false);
      } else {
          setNetworkWarning(null);
          setIsCorrectNetwork(true);
      }

      console.log("Requesting nonce for", walletAddress);
      const { nonce } = await getNonce(walletAddress);
      
      console.log("Requesting signature for challenge:", nonce);
      const signature = await provider.request({
        method: "personal_sign",
        params: [nonce, walletAddress],
      });

      console.log("Verifying signature on backend...");
      const authResult = await verifySignature(walletAddress, signature);

      if (authResult.token) {
        setAddress(walletAddress);
        setToken(authResult.token);
        
        localStorage.setItem("userAddress", walletAddress);
        localStorage.setItem("userToken", authResult.token);
        localStorage.removeItem("manualLogout");

        // Handle RBAC roles from auth response
        const userRoles = authResult.roles || authResult.user?.roles || [authResult.user?.role || 'user'];
        const userActiveRole = authResult.activeRole || authResult.user?.activeRole || userRoles[0];
        
        setRoles(userRoles);
        localStorage.setItem("userRoles", JSON.stringify(userRoles));

        if (!onlyAuthenticate) {
            setActiveRole(userActiveRole);
            setRole(userActiveRole);
            localStorage.setItem("activeRole", userActiveRole);
            localStorage.setItem("userRole", userActiveRole);
            console.log("[AuthContext] Authenticated with roles:", userRoles);
        } else {
            console.log("[AuthContext] Authenticated (Silent) with roles:", userRoles);
        }

        // Show dashboard selector if user has multiple roles AND suppression is not requested
        if (userRoles.length > 1 && !suppressSelector && !onlyAuthenticate) {
          setShowDashboardSelector(true);
        } else {
           setShowDashboardSelector(false); // Ensure it's off if suppressed
        }

        return { 
          address: walletAddress, 
          roles: userRoles, 
          activeRole: userActiveRole,
          user: authResult.user 
        };
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
      if (data.role) {
        setRole(data.role);
        localStorage.setItem("userRole", data.role);
        
        // Ensure roles array includes this
        setRoles(prev => {
            if (!prev.includes(data.role)) return [...prev, data.role];
            return prev;
        });
      }
    } catch (error) {
      console.error("Failed to refresh profile", error);
    }
  }, [address]);

  // Fetch current user info with roles from /me endpoint
  const fetchUserInfo = useCallback(async () => {
    if (!token) return null;
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/me`, {
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
    isCorrectNetwork,
    networkWarning,
    ROLE_DASHBOARD_MAP
  }), [user, role, roles, activeRole, address, token, chainId, login, logout, connectWallet, switchNetwork, switchRole, refreshProfile, fetchUserInfo, hasRole, hasAnyRole, isWalletConnecting, showDashboardSelector, isCorrectNetwork, networkWarning]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
