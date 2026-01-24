import { useEffect, useState } from 'react';
import { checkSBTMinted, mintSBT } from '../api/client';
import { CONTRACT_ADDRESSES } from '../api/config';
import { useAuth } from '../context/AuthContext';

const IdentityCard = () => {
  const { user, chainId, availableNetworks } = useAuth();
  const [loading, setLoading] = useState(false);
  const [minted, setMinted] = useState(false);

  useEffect(() => {
    let interval;
    if (user?.address) {
        checkStatus();
        // Poll every 10 seconds to ensure status is synced if minted elsewhere
        interval = setInterval(checkStatus, 10000);
    }
    return () => clearInterval(interval);
  }, [user?.address]);

  const checkStatus = async () => {
    if (!user?.address) return;
    try {
        const isMinted = await checkSBTMinted(user.address);
        console.log(`[IdentityCard] Checked SBT status for ${user.address}: ${isMinted}`);
        // Only update if we got a definitive boolean answer (true or false)
        // If it's null (error), we keep the current state (potentially 'true' from handleMint)
        if (isMinted !== null) {
            setMinted(isMinted);
        }
    } catch (err) {
        console.error("Failed to check SBT status:", err);
    }
  };

  const handleMint = async () => {
    setLoading(true);
    try {
        await mintSBT();
        setMinted(true);
        alert("Soulbound Reputation Card minted successfully! This NFT is now permanently linked to your wallet.");
    } catch (error) {
        console.error("Minting failed", error);
        // Special check: If error says already minted, we should trust it
        if (error.message?.includes("already minted") || error.data?.message?.includes("already minted")) {
            setMinted(true);
        } else {
            alert("Minting failed. Ensure you have enough gas and haven't already minted.");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleViewExplorer = () => {
    const currentNetwork = Object.values(availableNetworks).find(n => n.chainId.toLowerCase() === chainId?.toLowerCase());
    const baseUrl = currentNetwork?.blockExplorerUrls?.[0] || "https://etherscan.io/";
    window.open(`${baseUrl}address/${CONTRACT_ADDRESSES.SecureTransacSBT}`, '_blank');
  };

  const getRank = () => {
    const rawScore = user?.score !== undefined ? user.score : 0.5;
    // Normalize to 0-1 range if score is > 1 (e.g. 80 -> 0.8)
    const score = rawScore > 1 ? rawScore / 100 : rawScore;

    if (score >= 0.9) return { name: "DIAMOND", color: "from-cyan-300 to-blue-500", shadow: "shadow-cyan-500/50" };
    if (score >= 0.75) return { name: "PLATINUM", color: "from-gray-300 to-gray-500", shadow: "shadow-gray-400/50" };
    if (score >= 0.6) return { name: "GOLD", color: "from-yellow-400 to-orange-500", shadow: "shadow-yellow-500/50" };
    // Bronze: Vivid copper/orange to distinct from grayscale
    return { name: "BRONZE", color: "from-orange-500 to-amber-800", shadow: "shadow-orange-900/40" };
  };

  const rank = getRank();
  const displayScore = "****"; // Privacy mode: Score is hidden by default

  return (
    <div className="bg-gray-900 border border-border rounded-xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-border bg-gradient-to-br from-blue-900/20 to-indigo-900/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-xl">🏆</span> Dynamic Soulbound ID
          </h2>
          <p className="text-gray-400 text-xs mt-1">
              Your on-chain reputation visualized as a non-transferable achievement card.
          </p>
      </div>

      <div className="p-8 flex flex-col items-center">
        {/* The Card */}
        <div className={`relative w-64 h-40 bg-gradient-to-br ${rank.color} rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-700 group hover:scale-105 ${rank.shadow} ${!minted ? 'grayscale opacity-40' : 'animate-in fade-in duration-1000'}`}>
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start z-10">
                <div className="text-[8px] font-black text-white/60 tracking-widest uppercase mb-1">SecureTransac Network</div>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <span className="text-[10px]">🛡️</span>
                </div>
            </div>

            <div className="z-10">
                <div className="text-[10px] font-bold text-black/40 uppercase mb-1">Rank Status</div>
                <div className="text-2xl font-black text-white tracking-tighter drop-shadow-md">{rank.name}</div>
            </div>

            <div className="flex justify-between items-end z-10">
                <div>
                   <div className="text-[8px] font-mono text-white/70">{user?.name || 'CITIZEN'}</div>
                   <div className="text-[6px] font-mono text-white/50">{user?.address?.slice(0, 16)}...</div>
                </div>
                <div className="text-[18px] font-black text-white/80">{displayScore}</div>
            </div>
        </div>

        {!minted ? (
            <div className="mt-8 text-center space-y-4">
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Your reputation is eligible for <b>{rank.name}</b> tier.
                    Mint this Soulbound Token to display your status to 3rd party protocols.
                </p>
                <button 
                  onClick={handleMint}
                  disabled={loading}
                  className="bg-white text-black font-black px-8 py-3 rounded-full text-xs hover:bg-gray-200 transition-all shadow-xl shadow-white/10 disabled:opacity-50"
                >
                  {loading ? 'MINTING PROOF...' : 'MINT SOULBOUND IDENTITY'}
                </button>
            </div>
        ) : (
            <div className="mt-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="text-green-500 font-black text-xs uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                    Identity Verified On-Chain
                </div>
                <p className="text-[10px] text-gray-500">Contract: {CONTRACT_ADDRESSES.SecureTransacSBT.slice(0, 10)}...</p>
            </div>
        )}
      </div>

      <div className="p-4 bg-gray-950/50 border-t border-border flex items-center justify-between">
          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">ERC-721S (Non-Transferable)</span>
          <span 
            onClick={handleViewExplorer}
            className="text-[9px] text-blue-500 font-bold uppercase cursor-pointer hover:underline"
          >
            View on Explorer
          </span>
      </div>
    </div>
  );
};

export default IdentityCard;
