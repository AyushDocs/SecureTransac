import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getNonce, searchAddress, verifySignature } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem("userRole") || null);
  const [address, setAddress] = useState(() => localStorage.getItem("userAddress") || null);
  const [token, setToken] = useState(() => localStorage.getItem("userToken") || null);
  const [profile, setProfile] = useState(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!address) {
        setProfile(null);
        return;
      }
      try {
        const data = await searchAddress(address);
        setProfile(data);
        if (data.role) {
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
        role: profile?.role || role || 'user',
        name: (profile?.role || role || 'User').charAt(0).toUpperCase() + (profile?.role || role || 'User').slice(1),
        ...profile
      };
    }
    return null;
  }, [address, role, profile]);

  const login = useCallback((selectedRole, selectedAddress) => {
    setRole(selectedRole);
    setAddress(selectedAddress);
    localStorage.setItem("userRole", selectedRole);
    localStorage.setItem("userAddress", selectedAddress);
  }, []);

  const connectWallet = useCallback(async () => {
    // Check for window being defined (SSR safety, though not needed in Vite SPA usually)
    if (typeof window === "undefined") return null;

    console.log("Checking for Ethereum provider...", { 
      ethereum: window.ethereum, 
      isMetaMask: window.ethereum?.isMetaMask,
      web3: typeof window.web3 !== "undefined"
    });

    let provider = window.ethereum;

    // Handle generic ethereum provider check
    if (!provider && typeof window.web3 !== "undefined") {
      provider = window.web3.currentProvider;
    }

    if (!provider) {
      alert("No Ethereum wallet detected. If you just installed MetaMask, please refresh the page. Also ensure that the extension is enabled and has access to this site.");
      return null;
    }

    setIsWalletConnecting(true);
    try {
      // Handle the case where there might be multiple providers (e.g. Coinbase + MetaMask)
      if (provider.providers) {
        provider = provider.providers.find(p => p.isMetaMask) || provider.providers[0];
      }

      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const walletAddress = accounts[0];

      // Cryptographic Auth Step
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
        if (authResult.user?.role) {
          setRole(authResult.user.role);
          localStorage.setItem("userRole", authResult.user.role);
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
    setAddress(null);
    setToken(null);
    localStorage.removeItem("userRole");
    localStorage.removeItem("userAddress");
    localStorage.removeItem("userToken");
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!address) return;
    try {
      const data = await searchAddress(address);
      setProfile(data);
      if (data.role) {
        setRole(data.role);
        localStorage.setItem("userRole", data.role);
      }
    } catch (error) {
      console.error("Failed to refresh profile", error);
    }
  }, [address]);

  const value = useMemo(() => ({
    user,
    role,
    address,
    token,
    login,
    logout,
    connectWallet,
    refreshProfile,
    isWalletConnecting,
    isAdmin: role === "admin" || role === "deployer",
  }), [user, role, address, token, login, logout, connectWallet, refreshProfile, isWalletConnecting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
