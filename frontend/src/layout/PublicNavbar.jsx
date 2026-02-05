import { Link, useLocation } from "react-router-dom";

function PublicNavbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "text-cyan-400" : "text-gray-400 hover:text-white";
  };

  return (
    <nav className="h-16 border-b border-gray-800 bg-gray-950/50 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between relative">
        {/* Left: Navigation Links */}
        <div className="flex items-center gap-8 w-1/3">
          <Link to="/about" className={`text-sm font-medium transition-colors ${isActive('/about')}`}>
            About
          </Link>
          <Link to="/connect" className={`text-sm font-medium transition-colors ${isActive('/connect')}`}>
            Connect
          </Link>
        </div>

        {/* Center: Logo */}
        <div className="flex justify-center w-1/3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <span className="text-xl">🔐</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">
                Secure<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Transac</span>
              </h1>
              <span className="text-[10px] text-gray-500 font-mono">Trust Protocol</span>
            </div>
          </Link>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center justify-end gap-6 w-1/3">
          <Link to="/docs" className={`text-sm font-medium transition-colors ${isActive('/docs')}`}>
            Docs
          </Link>
          <Link 
            to="/login"
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default PublicNavbar;
