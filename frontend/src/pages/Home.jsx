import { useNavigate } from "react-router-dom";
import LiquidMetalHero from "@/components/ui/liquid-metal-hero";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      <LiquidMetalHero
        badge="DAO-Governed Trust Network"
        title="Cryptographically Verified Reputation"
        subtitle="SecureTransac leverages Homomorphic Encryption, Soulbound NFTs, and IPFS Safe Storage to build a verifiable trust layer. Earn AV Tokens while keeping your data private and secure."
        primaryCtaLabel="Start Verifying"
        secondaryCtaLabel="Developer Docs"
        onPrimaryCtaClick={() => navigate("/login")}
        onSecondaryCtaClick={() => navigate("/docs")}
        features={[
          "Advanced Cryptography",
          "Soulbound Identity",
          "Multi-Chain Future",
        ]}
      />

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
