import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../layout/PageWrapper';

const TrustDAO = () => {
    const { user } = useAuth();
    const [rewards, setRewards] = useState("0");
    const [balance, setBalance] = useState("0");
    const [staked, setStaked] = useState("0");
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [proposalText, setProposalText] = useState("");
    const [votedProposals, setVotedProposals] = useState({}); // Track user's votes: { proposalId: 'for' | 'against' }

    useEffect(() => {
        if (user?.address) {
            fetchDAOInfo();
        }
    }, [user?.address]);

    const fetchDAOInfo = async () => {
        // Mocking DAO data for demo
        setTimeout(() => {
            setBalance("5,000");
            setStaked("1,000");
            setRewards("124.50");
            setProposals([
                { id: 1, title: "Lower Whitelist Threshold to 750", for: 450000, against: 12000, status: "Active", endTime: Date.now() + 86400000 },
                { id: 2, title: "Add 'BlockFi' as Trusted Authority", for: 980000, against: 0, status: "Executed", endTime: Date.now() - 86400000 }
            ]);
            setLoading(false);
        }, 1000);
    };

    const handleStake = async () => {
        alert("Staking 1,000 $TRUST tokens. This will grant you 'Trusted Reporter' status on the main registry.");
        setStaked("1,000");
    };

    const handleClaim = () => {
        alert("Rewards claimed! 124.50 $TRUST added to your wallet.");
        setRewards("0");
        setBalance("5,124.50");
    };

    const handleCreateProposal = (e) => {
        e.preventDefault();
        if (!proposalText) return;
        const newP = {
            id: proposals.length + 1,
            title: proposalText,
            for: 0,
            against: 0,
            status: "Active",
            endTime: Date.now() + 259200000
        };
        setProposals([newP, ...proposals]);
        setProposalText("");
        alert("Proposal submitted to the DAO!");
    };

    const handleVote = (proposalId, voteType) => {
        // Check if user has staked tokens (required for voting)
        if (staked === "0") {
            alert("You must stake $TRUST tokens to vote on proposals.");
            return;
        }

        setProposals(prevProposals => 
            prevProposals.map(p => {
                if (p.id === proposalId) {
                    // Check if proposal is still active
                    if (p.status !== "Active") {
                        alert("This proposal is no longer active.");
                        return p;
                    }
                    
                    // Add vote (using staked amount as voting power)
                    const votingPower = parseInt(staked.replace(/,/g, '')) || 1000;
                    
                    if (voteType === 'for') {
                        return { ...p, for: p.for + votingPower };
                    } else {
                        return { ...p, against: p.against + votingPower };
                    }
                }
                return p;
            })
        );

        // Record that user has voted on this proposal
        setVotedProposals(prev => ({
            ...prev,
            [proposalId]: voteType
        }));

        alert(`Vote ${voteType === 'for' ? 'FOR' : 'AGAINST'} recorded! Your voting power: ${staked} $TRUST`);
    };

    // Check if user has already voted on a proposal
    const hasVoted = (proposalId) => votedProposals[proposalId] !== undefined;
    const getVoteType = (proposalId) => votedProposals[proposalId];

    return (
        <PageWrapper title="Governance DAO Portal">
            <div className="space-y-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">My Governance Balance</div>
                        <div className="text-3xl font-black text-white">{balance} <span className="text-sm text-cyan-500">$TRUST</span></div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">My Locked Stake</div>
                        <div className="text-3xl font-black text-white">{staked} <span className="text-sm text-purple-500">$TRUST</span></div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Claimable Rewards</div>
                        <div className="text-3xl font-black text-white">{rewards} <span className="text-sm text-green-500">$TRUST</span></div>
                        {rewards !== "0" && (
                            <button onClick={handleClaim} className="mt-2 text-[10px] text-green-400 font-black uppercase hover:underline">Claim Now</button>
                        )}
                    </div>
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-center">
                        <button 
                            onClick={handleStake}
                            disabled={staked !== "0"}
                            className={`w-full py-3 rounded-xl font-bold transition-all ${staked === "0" ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                            {staked === "0" ? '🛡️ Stake to become Authority' : '✅ Active Authority'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Proposals List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Active Proposals</h2>
                                <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded font-bold">SNAPSHOT ACTIVE</span>
                            </div>
                            <div className="divide-y divide-gray-800">
                                {proposals.map(p => (
                                    <div key={p.id} className="p-6 hover:bg-gray-800/30 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-[10px] text-gray-500 font-mono mb-1">PROPOSAL #{p.id}</div>
                                                <h3 className="text-lg font-bold text-white">{p.title}</h3>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${p.status === 'Active' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-800 text-gray-500'}`}>
                                                {p.status}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-400">For: {p.for.toLocaleString()}</span>
                                                <span className="text-gray-400">Against: {p.against.toLocaleString()}</span>
                                            </div>
                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-green-500" style={{ width: `${(p.for / (p.for + p.against + 1)) * 100}%` }}></div>
                                                <div className="h-full bg-red-500" style={{ width: `${(p.against / (p.for + p.against + 1)) * 100}%` }}></div>
                                            </div>
                                            {hasVoted(p.id) ? (
                                                <div className="flex items-center justify-center gap-2 py-2 bg-gray-800/50 rounded-lg">
                                                    <span className={`text-xs font-bold ${getVoteType(p.id) === 'for' ? 'text-green-500' : 'text-red-500'}`}>
                                                        ✓ You voted {getVoteType(p.id) === 'for' ? 'FOR' : 'AGAINST'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleVote(p.id, 'for')}
                                                        disabled={p.status !== 'Active'}
                                                        className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${p.status === 'Active' ? 'bg-green-600/10 hover:bg-green-600/20 text-green-500' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                                                    >
                                                        VOTE FOR
                                                    </button>
                                                    <button 
                                                        onClick={() => handleVote(p.id, 'against')}
                                                        disabled={p.status !== 'Active'}
                                                        className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${p.status === 'Active' ? 'bg-red-600/10 hover:bg-red-600/20 text-red-500' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                                                    >
                                                        VOTE AGAINST
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Propose Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl sticky top-6">
                            <h2 className="text-xl font-bold text-white mb-2">Create Proposal</h2>
                            <p className="text-xs text-gray-500 mb-6">Requires 1,000 $TRUST to initiate a vote. Proposals last 3 days.</p>
                            
                            <form onSubmit={handleCreateProposal} className="space-y-4">
                                <textarea 
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                                    placeholder="I propose that we..."
                                    rows="5"
                                    value={proposalText}
                                    onChange={e => setProposalText(e.target.value)}
                                    required
                                />
                                <button 
                                    type="submit"
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                                >
                                    Submit Proposal
                                </button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-gray-800">
                                <div className="text-[10px] text-gray-500 font-bold uppercase mb-4 text-center">Governance Parameters</div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Quorum</span>
                                        <span className="text-white font-bold">400,000 $TRUST</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Voting Period</span>
                                        <span className="text-white font-bold">72 Hours</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Proposal Threshold</span>
                                        <span className="text-white font-bold">1,000 $TRUST</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default TrustDAO;
