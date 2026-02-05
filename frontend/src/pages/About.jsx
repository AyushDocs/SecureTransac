function About() {
  return (
    <div className="min-h-screen pt-20 bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl md:text-5xl font-black mb-8">About SecureTransac</h1>
        
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-xl text-gray-400 leading-relaxed mb-12">
            SecureTransac is building the trust layer for the decentralized internet. 
            In a world of anonymous wallets, we provide the tools to verify humanity and reputation without compromising privacy.
          </p>

          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Our Mission</h3>
              <p className="text-gray-400 leading-relaxed">
                To create a safer Web3 ecosystem where users can transact with confidence using 
                <b> AV Tokens</b> and verified <b>Soulbound NFTs</b>. As a <b>DAO</b>, we are governed by the community 
                to ensure fairness and transparency.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">The Technology</h3>
              <p className="text-gray-400 leading-relaxed">
                We employ advanced cryptographic techniques including the <b>Paillier Cryptosystem</b> 
                for homomorphic encryption. Coupled with <b>Fake Client IDs</b>, <b>Zero-Knowledge Proofs</b>,
                and <b>IPFS Safe Storage</b> for decentralized data persistence, we provide maximum privacy.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 md:p-10">
              <h3 className="text-xl font-bold text-white mb-6">For Companies</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-1">✓</span>
                  <span>Authenticate users without liability for data leaks.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-1">✓</span>
                  <span>Monetize trust services by verifying user subsets.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-1">✓</span>
                  <span>Access a curated list of high-reputation addresses.</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 md:p-10">
              <h3 className="text-xl font-bold text-white mb-6">For Users</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Always be reputed: Your good behavior pays off.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Report malicious actors to clean up the ecosystem.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Reputation travels with you across chains (Coming Soon).</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 md:p-12 mb-20">
            <h3 className="text-2xl font-bold text-white mb-8 text-center">Key Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <Stat label="Verified Users" value="10k+" />
              <Stat label="Trust Scores" value="50k+" />
              <Stat label="Partners" value="25+" />
              <Stat label="Networks" value="5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-3xl font-black text-cyan-400 mb-1">{value}</div>
      <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default About;
