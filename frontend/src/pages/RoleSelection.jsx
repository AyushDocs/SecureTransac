import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  {
    id: "user",
    title: "Normal User",
    description: "View your trust score, transactions, and provide feedback.",
    icon: (
      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "company",
    title: "Trusted Company",
    description: "Assign scores to users and help blacklist fraudulent actors.",
    icon: (
      <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "admin",
    title: "System Admin",
    description: "Manage global statistics and handle one-shot score overrides.",
    icon: (
      <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: "deployer",
    title: "Contract Deployer",
    description: "Manage contract reporters and global trust configurations.",
    icon: (
      <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
];

function RoleSelection() {
  const navigate = useNavigate();
  const { login, address, connectWallet, isWalletConnecting, logout, user } = useAuth();

  const handleSelect = async (roleId) => {
    if (!address) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
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

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-6 tracking-tight">
            Secure<span className="text-blue-500">Transac</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Transparent on-chain trust registry and AI-driven risk scoring. 
            {address ? " Choose your role to register or enter." : " Connect your wallet to begin."}
          </p>

          <div className="flex flex-col items-center gap-4">
            {!address ? (
              <button
                onClick={connectWallet}
                disabled={isWalletConnecting}
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-95 disabled:opacity-70"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {isWalletConnecting ? "Connecting to MetaMask..." : "Connect MetaMask Wallet"}
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Connected Wallet</p>
                  <p className="text-white font-mono">{address.slice(0, 6)}...{address.slice(-4)}</p>
                </div>
                <button 
                  onClick={logout}
                  className="ml-4 p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="Disconnect"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ROLES.map((role) => {
            const isCurrentRole = user?.role === role.id;
            const isRegistered = !!user?.registrationDate;
            
            return (
              <button
                key={role.id}
                onClick={() => handleSelect(role.id)}
                disabled={isRegistered && !isCurrentRole}
                className={`bg-gray-900 border p-8 rounded-2xl text-left transition-all group relative overflow-hidden ${
                  isCurrentRole 
                    ? "border-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.2)]" 
                    : isRegistered 
                      ? "border-gray-800 opacity-50 cursor-not-allowed" 
                      : "border-gray-800 hover:bg-gray-800 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                }`}
              >
                <div className="absolute top-0 right-0 p-4">
                  {isCurrentRole ? (
                    <span className="text-blue-500 text-xs font-bold uppercase tracking-widest">Active Profile</span>
                  ) : (
                    <svg className="w-6 h-6 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </div>
                <div className="mb-6 group-hover:scale-110 transition-transform origin-left">{role.icon}</div>
                <h2 className="text-2xl font-bold text-white mb-2">{role.title}</h2>
                <p className="text-gray-400 leading-relaxed text-sm">{role.description}</p>
                <div className="mt-6">
                   <div className={`text-xs font-bold uppercase px-3 py-1 rounded-full inline-block ${
                     isCurrentRole ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-400"
                   }`}>
                     {isCurrentRole ? "Enter Dashboard" : isRegistered ? "Locked" : "Register as " + role.title}
                   </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;
