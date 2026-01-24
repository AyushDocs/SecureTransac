import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoleSwitcher } from "../components/DashboardSelector";
import { useAuth } from "../context/AuthContext";
import { WalletButton } from "../components/WalletButton";
// Top navigation bar with search and user info
function NetworkSwitcher() {
  const { chainId, switchNetwork, availableNetworks } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Helper to normalize chainId comparison
  const getCurrentNetwork = () => {
    if (!chainId) return null;
    console.log("Current Chain ID:", chainId); // Debug Log
    return Object.values(availableNetworks).find(n => 
      // Compare both as hex strings or raw values if matching format
      // Note: chainId from provider might be 0x539 or 1337(decimal)
      // availableNetworks uses hex strings (0x539)
      n.chainId.toLowerCase() === chainId.toString().toLowerCase() ||
      parseInt(n.chainId, 16) === parseInt(chainId, 16)
    );
  };

  const current = getCurrentNetwork();

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs font-medium text-gray-300 hover:text-white transition-colors"
      >
        <span className={`w-2 h-2 rounded-full ${current ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
        {current ? current.chainName : 'Wrong Network'}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-1 z-20">
            {Object.entries(availableNetworks).map(([key, net]) => (
                <button
                key={key}
                onClick={() => { switchNetwork(key); setIsOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"
                >
                <span className={`w-2 h-2 rounded-full ${chainId?.toLowerCase() === net.chainId.toLowerCase() ? 'bg-green-500' : 'bg-gray-600'}`}></span>
                {net.chainName}
                </button>
            ))}
            </div>
        </>
      )}
    </div>
  );
}

function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user, logout, role, activeRole } = useAuth();
  
  // Check if user can access search
  const currentRole = activeRole || role;
  const canSearch = ["company", "creator", "admin", "deployer"].includes(currentRole);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && canSearch) {
      navigate(`/address/${searchQuery.trim()}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="lg:hidden flex items-center gap-2 mr-2">
            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
        </div>

        {/* Search - Only for company/admin/deployer */}
        {canSearch ? (
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:block">
              <div className="relative">
              <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
              >
                  <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
              </svg>
              <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search address..."
                  className="w-full h-9 pl-9 pr-4 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
              />
              </div>
          </form>
        ) : (
          <div className="flex-1 max-w-xl hidden sm:flex items-center">
            <span className="text-sm text-gray-500">
              Welcome, <span className="text-white font-medium">{user?.name || 'User'}</span>
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 lg:gap-4 ml-2">
        {/* Role Switcher (for multi-role users) */}
        <RoleSwitcher />

        {/* Network Switcher */}
        <NetworkSwitcher />

        {/* Notification Bell */}
        <NotificationBell />

        <div className="relative group">
          <button className="flex items-center gap-2 lg:gap-3 lg:pr-4 lg:border-r lg:border-gray-800 outline-none">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shrink-0">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden lg:block text-left whitespace-nowrap">
              <p className="text-sm font-bold text-white leading-tight">{user?.name}</p>
              <p className="text-[10px] text-gray-500 font-mono leading-tight">{user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}</p>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-1 z-20 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 transform origin-top-right">
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to disconnect?")) {
                  logout();
                }
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Disconnect Wallet
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Notification Bell Component
function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, type: 'success', title: 'Verification Approved', message: 'Your identity verification was successful', time: '2m ago', unread: true },
    { id: 2, type: 'warning', title: 'Score Update', message: 'Your trust score increased to 750', time: '1h ago', unread: true },
    { id: 3, type: 'info', title: 'New Report Filed', message: 'A security report was submitted for review', time: '3h ago', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const getIcon = (type) => {
    switch(type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:block relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map(notif => (
                <div 
                  key={notif.id}
                  className={`p-3 border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors ${notif.unread ? 'bg-blue-500/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{getIcon(notif.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{notif.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{notif.time}</p>
                    </div>
                    {notif.unread && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-gray-800">
              <button className="w-full text-center text-xs text-blue-400 hover:text-blue-300 py-2 font-semibold">
                View All Notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Navbar;
