import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const phrases = ["Secured Reputation", "Verified Identity", "Trustless Data", "Safe Storage"];

  useEffect(() => {
    const i = loopNum % phrases.length;
    const fullText = phrases[i];

    let speed = isDeleting ? 50 : 100;
    if (!isDeleting && text === fullText) speed = 2000;
    if (isDeleting && text === '') speed = 500;

    const timer = setTimeout(() => {
      if (!isDeleting && text === fullText) {
        setIsDeleting(true);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(prev => prev + 1);
      } else {
        setText(
          isDeleting 
            ? fullText.substring(0, text.length - 1) 
            : fullText.substring(0, text.length + 1)
        );
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum]);

  return (
    <div className="min-h-screen pt-20 bg-gray-950 text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-500/20 blur-[120px] rounded-full pointing-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full pointing-events-none -z-10" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 ">
        <div className="text-center max-w-4xl mx-auto pb-10">
          
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight min-h-[3ch] lg:min-h-[2ch]">
            Cryptographically <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent inline-block">
              {text}
              <span className="text-cyan-400 animate-pulse ml-1">|</span>
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 leading-relaxed max-w-2xl mx-auto">
            SecureTransac is a <b>DAO</b> leveraging Homomorphic Encryption, Soulbound NFTs, and 
            <b> IPFS Safe Storage</b> to build a verifiable trust layer. Earn <b>AV Tokens</b> while 
            keeping your data private and secure.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              Start Verifying
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link 
              to="/docs"
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white text-lg font-bold rounded-xl transition-all"
            >
              Developer Docs
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon="🔐"
            title="Advanced Cryptography"
            description="Utilizing Paillier Homomorphic Encryption to compute trust scores on encrypted data."
          />
          <FeatureCard 
            icon="💎"
            title="Soulbound Identity"
            description="Your reputation is minted as non-transferable Soulbound NFTs, anchored to your identity."
          />
          <FeatureCard 
            icon="📦"
            title="IPFS Safe Storage"
            description="Decentralized, redundant storage for all verification proofs ensuring data permanence."
          />
          <FeatureCard 
            icon="🌐"
            title="Multi-Chain Future"
            description="We aim to support multiple chains soon, making your reputation portable."
          />
        </div>
      </div>

      {/* Ecosystem Section */}
      <div className="max-w-7xl mx-auto px-6 pb-32">
        <div className="bg-gray-900/30 border border-gray-800 rounded-3xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Join the Ecosystem</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
                <span className="text-2xl">🏢</span> For Companies
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Authenticate users securely without handling sensitive data. Join a budding marketplace 
                where you can monetize verification services and access high-trust user bases.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-3 flex items-center gap-2">
                <span className="text-2xl">👤</span> For Users
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Build a portable reputation. Report malicious activity to keep the network clean and 
                ensure your good standing is recognized across all partner dApps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-8 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl hover:border-cyan-500/50 transition-colors group">
      <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

export default Home;
