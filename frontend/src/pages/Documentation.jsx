import { useState } from "react";

function Documentation() {
  const [activeTab, setActiveTab] = useState("package");

  const tabs = [
    { id: "package", label: "📦 NPM Package" },
    { id: "contracts", label: "🛡️ Vulnerability Demo" },
    { id: "soulbound", label: "💎 Soulbound ID" },
  ];

  return (
    <div className="min-h-screen pt-20 bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 fixed top-20 bottom-0 left-0 border-r border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-y-auto z-40">
        <div className="p-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Documentation</h2>
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 lg:p-12 max-w-5xl">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black mb-4">Developer Resources</h1>
          <p className="text-gray-400 text-lg">
            Integrate SecureTransac into your dApp using our NPM package and smart contracts.
          </p>
        </div>

        <div className="bg-gray-900/30 border border-gray-800 rounded-3xl p-8 shadow-xl">
          {activeTab === "package" && <PackageSection />}
          {activeTab === "contracts" && <ContractsSection />}
          {activeTab === "soulbound" && <SoulboundSection />}
        </div>
      </main>
    </div>
  );
}

function PackageSection() {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">secure-transac-contracts</h2>
        <p className="text-gray-400 mb-6">
          Our official NPM package provides the base contracts and interfaces needed to integrate 
          SecureTransac's reputation layer into your smart contracts.
        </p>
        
        <div className="bg-black/50 rounded-xl p-4 font-mono text-sm text-gray-300 border border-gray-800 flex items-center justify-between">
          <code>npm install secure-transac-contracts</code>
          <button 
             onClick={() => navigator.clipboard.writeText("npm install secure-transac-contracts")}
             className="text-gray-500 hover:text-white"
             title="Copy"
          >
            📋
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
           <h3 className="text-lg font-bold text-white mb-2">Features</h3>
           <ul className="space-y-2 text-gray-400">
             <li>• Pre-built <code className="text-cyan-400">Guardian.sol</code> base contract</li>
             <li>• Interfaces for Reputation Registry</li>
             <li>• Helper utilities for score verification</li>
             <li>• Paillier encryption utility libraries</li>
           </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Quick Start</h3>
          <pre className="bg-black/50 rounded-xl p-4 font-mono text-sm text-cyan-400 overflow-x-auto">
{`import "secure-transac-contracts/contracts/Guardian.sol";

contract MyContract is Guardian {
    constructor(address _registry) 
        Guardian(_registry, 80) {} // Requires 0.8 score
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function ContractsSection() {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Securing Vulnerable Contracts</h2>
        <p className="text-gray-400 mb-8">
          See how SecureTransac protects against common vulnerabilities like Reentrancy by gating 
          access based on reputation scores. Even if code is buggy, malicious actors cannot exploit it.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Vulnerable Example */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
          <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
            <span>⚠️</span> VulnerableBank.sol
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Contains a reentrancy bug where state is updated <i>after</i> external call.
          </p>
          <pre className="bg-black/50 rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto">
{`function withdraw() external {
    uint256 amount = balances[msg.sender];
    require(amount > 0, "No balance");

    // VULNERABILITY: External call before update
    (bool s, ) = msg.sender.call{value: amount}("");
    require(s, "Failed");

    balances[msg.sender] = 0;
}`}
          </pre>
        </div>

        {/* Secure Example */}
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
          <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2">
            <span>🛡️</span> SecureBank.sol
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Inherits <code className="text-green-400">Guardian</code>. Logic error remains, but exploits are blocked.
          </p>
          <pre className="bg-black/50 rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto">
{`import ".../Guardian.sol";

// Only users with >80 score can call this
function withdraw() external onlyTrusted {
    uint256 amount = balances[msg.sender];
    require(amount > 0, "No balance");

    // Exploiter (Low Score) BLOCKED here
    (bool s, ) = msg.sender.call{value: amount}("");
    require(s, "Failed");

    balances[msg.sender] = 0;
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function SoulboundSection() {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
       <div>
        <h2 className="text-2xl font-bold text-white mb-4">Soulbound Identity (SBA)</h2>
        <p className="text-gray-400">
          Your reputation is anchored to a Soulbound Token (SBT) that cannot be transferred. 
          This creates a persistent on-chain identity that grows with your positive interactions.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
           <div className="text-4xl mb-4">🆔</div>
           <h3 className="font-bold text-white mb-2">Minting</h3>
           <p className="text-sm text-gray-400">
             Users mint an SBA token upon registration. This token is linked to their wallet and holds metadata pointers to their encrypted score.
           </p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
           <div className="text-4xl mb-4">📈</div>
           <h3 className="font-bold text-white mb-2">Score Updates</h3>
           <p className="text-sm text-gray-400">
             The DAO updates the score associated with the SBA based on behavior. Good actors see scores rise; bad actors see them fall.
           </p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
           <div className="text-4xl mb-4">🔍</div>
           <h3 className="font-bold text-white mb-2">Integration</h3>
           <p className="text-sm text-gray-400">
             dApps can query the SBA contract to instantly verify if a user has a valid ID and check their current trust tier.
           </p>
        </div>
      </div>
    </div>
  );
}

export default Documentation;
