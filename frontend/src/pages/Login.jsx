import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useNavigate } from "react-router-dom";
import { useAccount, useDisconnect } from 'wagmi';
import { useAuth } from "../context/AuthContext";

const ROLES = [
  {
    id: "user",
    title: "Individual",
    subtitle: "Personal Account",
    description: "View your trust score, manage identity, and provide feedback on transactions.",
    icon: "👤",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "viewer",
    title: "Auditor",
    subtitle: "Read-Only Access",
    description: "Monitor network health, view public dashboards, and audit trust metrics.",
    icon: "👁️",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "company",
    title: "Company",
    subtitle: "Business Account",
    description: "Verify users, assign trust scores, and manage institutional KYB verification.",
    icon: "🏢",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "admin",
    title: "Admin",
    subtitle: "System Administrator",
    description: "Manage global analytics, handle score overrides, and monitor network health.",
    icon: "🛡️",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "deployer",
    title: "Developer",
    subtitle: "Smart Contract Developer",
    description: "Deploy contracts, manage reporters, and configure trust registry parameters.",
    icon: "🚀",
    color: "from-orange-500 to-red-500",
  },
];

const SUPPORTED_WALLETS = [
  { name: 'MetaMask', icon: '🦊', popular: true },
  { name: 'Coinbase', icon: '🔵', popular: true },
  { name: 'WalletConnect', icon: '🔗', popular: true },
  { name: 'Phantom', icon: '👻', popular: false },
  { name: 'Rainbow', icon: '🌈', popular: false },
];

function Login() {
  const navigate = useNavigate();
  const { open } = useWeb3Modal();
  const { address: wagmiAddress, isConnected: wagmiConnected, connector } = useAccount();
  const { login, address: authAddress, connectWallet, isWalletConnecting, logout, user, roles, token } = useAuth(); // Added token

  // Use wagmi address if connected, otherwise fall back to authAddress
  const address = wagmiConnected ? wagmiAddress : authAddress;
  const isConnected = wagmiConnected || !!authAddress;
  const walletName = connector?.name || 'Wallet';

  const handleConnect = async () => {
    // Open Web3Modal for wallet selection
    open();
  };

  const handleLegacyConnect = async () => {
    // Fallback to MetaMask-only connection
    await connectWallet();
  };

  const handleSelect = async (roleId) => {
    if (!address) {
      open(); // Open wallet selector
      return;
    }

    try {
      // Ensure we are authenticated (have a session token)
      let currentRoles = roles;
      let currentUser = user;
      let currentAddress = address;

      if (!token) {
        console.log("Wallet connected but not authenticated. Triggering login...");
        // Use Silent Authentication (don't set global role state yet) to prevent App.jsx from switching layouts excessively
        const authData = await connectWallet(true, true); 
        if (!authData) return; // User rejected or failed
        
        // Update local variables with fresh data
        currentRoles = authData.roles;
        currentUser = authData.user;
        currentAddress = authData.address;
      }

      // If user ALREADY has the selected role, just login and go to dashboard
      if (currentRoles && currentRoles.includes(roleId)) {
        console.log(`User already has role ${roleId}, logging in...`);
        // Explicitly set the active role now (triggers layout switch)
        login(roleId, currentAddress);
        navigate("/dashboard");
        return;
      }

      // If user does NOT have the role, send them to register (even if they have other roles)
      // We are essentially authenticated (token/address set) but in "Public" layout mode still
      console.log(`User missing role ${roleId}, redirecting to registration...`);
      navigate(`/register?role=${roleId}`);

    } catch (error) {
      console.error(error);
    }
  };

  const { disconnect } = useDisconnect();

  const handleDisconnect = async () => {
    disconnect();
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 my-12">
      <div className="max-w-5xl w-full">

        {/* Wallet Connection Section */}
        <div className="mb-12">
          {!isConnected ? (
            <div className="max-w-md mx-auto">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white text-center mb-6">Connect Your Wallet</h3>
                
                {/* Primary Connect Button */}
                <button
                  onClick={handleConnect}
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-3 mb-6"
                >
                  <span className="text-xl">🔌</span>
                  <span>Connect Wallet</span>
                </button>

                {/* Supported Wallets */}
                <div className="pt-6 border-t border-gray-800">
                  <p className="text-xs text-gray-500 text-center mb-4">Supported Wallets</p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    {SUPPORTED_WALLETS.map((wallet) => (
                      <div 
                        key={wallet.name}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg"
                      >
                        <span>{wallet.icon}</span>
                        <span className="text-xs text-gray-400">{wallet.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legacy MetaMask fallback */}
                <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                  <button
                    onClick={handleLegacyConnect}
                    disabled={isWalletConnecting}
                    className="text-sm text-gray-500 hover:text-cyan-400 transition-colors"
                  >
                    {isWalletConnecting ? "Connecting..." : "Or connect with MetaMask only →"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 px-6 py-4 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xl shadow-lg">
                  ✓
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    {!token ? "Continuing connection as..." : `Connected via ${walletName}`}
                  </p>
                  <p className="text-white font-mono text-lg">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
                </div>
                <button 
                  onClick={handleDisconnect}
                  className="ml-4 p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="Disconnect"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Switch Wallet Button */}
              <button
                onClick={handleConnect}
                className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors"
                title="Switch Wallet"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Role Selection Grid */}
        {isConnected && (
        <div className="mb-8">
          <h2 className="text-center text-lg font-bold text-white mb-6">Login As</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {ROLES.map((role) => {
              const isCurrentRole = user?.role === role.id;
              const isRegistered = !!user?.registrationDate;
              const hasThisRole = roles?.includes(role.id);
              
              return (
                <button
                  key={role.id}
                  onClick={() => handleSelect(role.id)}
                  disabled={isRegistered && !isCurrentRole && !hasThisRole}
                  className={`relative w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(33.33%-1.5rem)] xl:w-[calc(20%-1.5rem)] min-w-[280px] bg-gray-900 border p-8 rounded-3xl text-left transition-all group overflow-hidden ${
                    isCurrentRole || hasThisRole
                      ? "border-cyan-500 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.2)]" 
                      : isRegistered && !hasThisRole
                        ? "border-gray-800 opacity-50 cursor-not-allowed" 
                        : "border-gray-800 hover:bg-gray-800 hover:border-cyan-500/50"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-3xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    {role.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-2">{role.title}</h3>
                  <p className="text-sm text-cyan-400 font-medium mb-3">{role.subtitle}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{role.description}</p>

                  {/* Badge */}
                  <div className="mt-6">
                    {isCurrentRole ? (
                      <span className="text-xs bg-cyan-500 text-white px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                        Continue with
                      </span>
                    ) : hasThisRole ? (
                      <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                        ✓ Authorized
                      </span>
                    ) : isRegistered ? (
                      <span className="text-xs bg-gray-800 text-gray-500 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                        Locked
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                        Select
                      </span>
                    )}
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default Login;
