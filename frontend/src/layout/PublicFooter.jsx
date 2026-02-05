import { Link } from "react-router-dom";

function PublicFooter() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-sm">🔐</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white tracking-tight leading-none">
                  Secure<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Transac</span>
                </span>
              </div>
            </Link>
            <p className="text-gray-400 leading-relaxed max-w-sm">
              Building the trust layer for the decentralized internet. Verify humanity 
              and reputation without compromising privacy.
            </p>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-cyan-400 transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/docs" className="text-gray-400 hover:text-cyan-400 transition-colors">Documentation</Link>
              </li>
              <li>
                <Link to="/connect" className="text-gray-400 hover:text-cyan-400 transition-colors">Contact Support</Link>
              </li>
            </ul>
          </div>

          {/* Socials Column */}
          <div>
            <h4 className="text-white font-bold mb-6">Connect</h4>
            <div className="flex gap-4">
              {['Twitter', 'GitHub', 'Discord'].map((social) => (
                <a 
                  key={social}
                  href="#" 
                  className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all"
                  aria-label={social}
                >
                  {/* Simple text placeholder icons or SVGs could go here */}
                  <span className="text-xs">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} SecureTransac DAO. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-gray-500 hover:text-gray-300">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-500 hover:text-gray-300">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
