import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useNavigate } from "react-router-dom";
import { useAccount } from 'wagmi';
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
    id: "company",
    title: "Company",
    subtitle: "Business Account",
    description: "Verify users, assign trust scores, and manage institutional KYB verification.",
    icon: "🏢",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "admin",
    title: "Network Admin",
    subtitle: "System Administrator",
    description: "Manage global analytics, handle score overrides, and monitor network health.",
    icon: "🛡️",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "deployer",
    title: "Contract Deployer",
    subtitle: "Protocol Manager",
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

function RoleSelection() {
  const navigate = useNavigate();
  const { open } = useWeb3Modal();
  const { address: wagmiAddress, isConnected: wagmiConnected, connector } = useAccount();
  const { login, address: authAddress, connectWallet, isWalletConnecting, logout, user, roles } = useAuth();

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
      // If user has multiple roles (RBAC), go to dashboard
      if (roles && roles.length > 0) {
        login(roleId, address);
        navigate("/dashboard");
        return;
      }

      // If user is already registered, just login
      if (user?.registrationDate) {
        login(user.role, address);
        navigate("/dashboard");
      } else {
        // Otherwise, go to detailed registration page
        navigate(`/register?role=${roleId}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDisconnect = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-3xl">🔐</span>
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
            Secure<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Transac</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Decentralized Trust Scoring & Identity Verification Platform. 
            {isConnected ? " Choose your path to continue." : " Connect your wallet to begin."}
          </p>
        </div>

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
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Connected via {walletName}</p>
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
        <div className="mb-8">
          <h2 className="text-center text-lg font-bold text-white mb-6">Choose Your Path</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map((role) => {
              const isCurrentRole = user?.role === role.id;
              const isRegistered = !!user?.registrationDate;
              const hasThisRole = roles?.includes(role.id);
              
              return (
                <button
                  key={role.id}
                  onClick={() => handleSelect(role.id)}
                  disabled={isRegistered && !isCurrentRole && !hasThisRole}
                  className={`relative bg-gray-900 border p-6 rounded-2xl text-left transition-all group overflow-hidden ${
                    isCurrentRole || hasThisRole
                      ? "border-cyan-500 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.2)]" 
                      : isRegistered && !hasThisRole
                        ? "border-gray-800 opacity-50 cursor-not-allowed" 
                        : "border-gray-800 hover:bg-gray-800 hover:border-cyan-500/50"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    {role.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-white mb-1">{role.title}</h3>
                  <p className="text-xs text-cyan-400 font-medium mb-2">{role.subtitle}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{role.description}</p>

                  {/* Badge */}
                  <div className="mt-4">
                    {isCurrentRole ? (
                      <span className="text-xs bg-cyan-500 text-white px-3 py-1 rounded-full font-bold">
                        Current Dashboard
                      </span>
                    ) : hasThisRole ? (
                      <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-bold">
                        ✓ Authorized
                      </span>
                    ) : isRegistered ? (
                      <span className="text-xs bg-gray-800 text-gray-500 px-3 py-1 rounded-full font-bold">
                        Locked
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full font-bold group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                        Select
                      </span>
                    )}
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600">
          <p>Powered by Ethereum • Zero-Knowledge Proofs • AI Risk Analysis</p>
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;
