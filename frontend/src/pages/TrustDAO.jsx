import { useEffect, useState } from 'react';
import Web3 from "web3";
import CreditManager from '../components/CreditManager';
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
    const [votedProposals, setVotedProposals] = useState({});
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        if (user?.address) {
            loadData();
        }
    }, [user?.address, refresh]);

    const loadData = async () => {
        try {
            const w3 = new Web3(window.ethereum);
            const netId = await w3.eth.net.getId();
            
            const TokenArtifact = await import("../contracts/SecureTransacToken.json"); 
            const DaoArtifact = await import("../contracts/TrustDAO.json");

            const tokenData = TokenArtifact.default.networks[netId] || TokenArtifact.default.networks[5777];
            const daoData = DaoArtifact.default.networks[netId] || DaoArtifact.default.networks[5777];

            if (!tokenData || !daoData) {
                setLoading(false);
                return;
            }

            const token = new w3.eth.Contract(TokenArtifact.default.abi, tokenData.address);
            const dao = new w3.eth.Contract(DaoArtifact.default.abi, daoData.address);

            // Fetch Stats
            const bal = await token.methods.balanceOf(user.address).call();
            const stk = await dao.methods.stakes(user.address).call();
            const rew = await dao.methods.claimableRewards(user.address).call();
            const nextId = await dao.methods.nextProposalId().call();

            setBalance(parseFloat(w3.utils.fromWei(bal, 'ether')).toLocaleString());
            setStaked(parseFloat(w3.utils.fromWei(stk, 'ether')).toLocaleString());
            setRewards(parseFloat(w3.utils.fromWei(rew, 'ether')).toLocaleString());

            // Fetch Proposals
            const pList = [];
            const votesMap = {};
            for (let i = 0; i < nextId; i++) {
                const p = await dao.methods.proposals(i).call();
                const voted = await dao.methods.getHasVoted(i, user.address).call();
                
                pList.push({
                    id: p.id,
                    title: p.description,
                    for: parseFloat(w3.utils.fromWei(p.forVotes, 'ether')),
                    against: parseFloat(w3.utils.fromWei(p.againstVotes, 'ether')),
                    status: p.executed ? "Executed" : (Date.now() > Number(p.endTime) * 1000 ? "Pending Execution" : "Active"),
                    endTime: Number(p.endTime) * 1000,
                    pType: p.pType,
                    proposer: p.proposer
                });
                if (voted) votesMap[p.id] = true;
            }
            setProposals(pList.reverse());
            setVotedProposals(votesMap);
            setLoading(false);
        } catch (err) {
            console.error("DAO Load Error:", err);
            setLoading(false);
        }
    };

    const handleStake = async () => {
        try {
            const w3 = new Web3(window.ethereum);
            const netId = await w3.eth.net.getId();
            const TokenArtifact = await import("../contracts/SecureTransacToken.json"); 
            const DaoArtifact = await import("../contracts/TrustDAO.json");
            const tokenData = TokenArtifact.default.networks[netId] || TokenArtifact.default.networks[5777];
            const daoData = DaoArtifact.default.networks[netId] || DaoArtifact.default.networks[5777];
            
            const token = new w3.eth.Contract(TokenArtifact.default.abi, tokenData.address);
            const dao = new w3.eth.Contract(DaoArtifact.default.abi, daoData.address);
            const amount = w3.utils.toWei("1000", "ether");

            alert("Approving 1,000 $AV for staking...");
            await token.methods.approve(daoData.address, amount).send({ from: user.address });
            alert("Staking...");
            await dao.methods.stake().send({ from: user.address });
            setRefresh(r => r + 1);
        } catch (err) {
            alert("Stake failed: " + err.message);
        }
    };

    const handleCreateProposal = async (e) => {
        e.preventDefault();
        try {
            const w3 = new Web3(window.ethereum);
            const netId = await w3.eth.net.getId();
            const DaoArtifact = await import("../contracts/TrustDAO.json");
            const daoData = DaoArtifact.default.networks[netId] || DaoArtifact.default.networks[5777];
            const dao = new w3.eth.Contract(DaoArtifact.default.abi, daoData.address);

            await dao.methods.createProposal(proposalText).send({ from: user.address });
            setProposalText("");
            setRefresh(r => r + 1);
            alert("Proposal submitted!");
        } catch (err) {
            alert("Proposal failed: " + err.message);
        }
    };

    const handleVote = async (proposalId, support) => {
        try {
            const w3 = new Web3(window.ethereum);
            const netId = await w3.eth.net.getId();
            const DaoArtifact = await import("../contracts/TrustDAO.json");
            const daoData = DaoArtifact.default.networks[netId] || DaoArtifact.default.networks[5777];
            const dao = new w3.eth.Contract(DaoArtifact.default.abi, daoData.address);

            await dao.methods.vote(proposalId, support).send({ from: user.address });
            setRefresh(r => r + 1);
        } catch (err) {
            alert("Vote failed: " + err.message);
        }
    };

    const handleExecute = async (proposalId) => {
        try {
            const w3 = new Web3(window.ethereum);
            const netId = await w3.eth.net.getId();
            const DaoArtifact = await import("../contracts/TrustDAO.json");
            const daoData = DaoArtifact.default.networks[netId] || DaoArtifact.default.networks[5777];
            const dao = new w3.eth.Contract(DaoArtifact.default.abi, daoData.address);

            await dao.methods.executeProposal(proposalId).send({ from: user.address });
            setRefresh(r => r + 1);
            alert("Proposal executed!");
        } catch (err) {
            alert("Execution failed: " + err.message);
        }
    };

    return (
        <PageWrapper title="Governance DAO Portal">
            <div className="space-y-8">
                <div className="md:col-span-1">
                    <CreditManager />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl h-full flex flex-col justify-center">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">My Wallet Balance</div>
                        <div className="text-3xl font-black text-white">{balance} <span className="text-sm text-cyan-500">$AV</span></div>
                    </div>
                    
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl h-full flex flex-col justify-center">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">My Locked Stake</div>
                        <div className="text-3xl font-black text-white">{staked} <span className="text-sm text-purple-500">$AV</span></div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl h-full flex flex-col justify-center text-center">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Claimable Rewards</div>
                        <div className="text-3xl font-black text-white">{rewards} <span className="text-sm text-green-500">$AV</span></div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col justify-center">
                        <button 
                            onClick={handleStake}
                            disabled={staked !== "0"}
                            className={`w-full py-4 rounded-xl font-bold transition-all ${staked === "0" ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                            {staked === "0" ? '🛡️ Stake to join DAO' : '✅ Active Member'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Active Proposals</h2>
                                <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded font-bold uppercase tracking-widest">Live Chain Data</span>
                            </div>
                            
                            <div className="divide-y divide-gray-800">
                                {loading ? (
                                    <div className="p-10 text-center text-gray-500 uppercase tracking-widest text-xs">Loading Governance State...</div>
                                ) : proposals.length === 0 ? (
                                    <div className="p-10 text-center text-gray-500 uppercase tracking-widest text-xs">No active proposals found</div>
                                ) : proposals.map(p => (
                                    <div key={p.id} className="p-6 hover:bg-gray-800/30 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase">
                                                    #{p.id} • {p.pType === "1" ? "KYB ADMISSION" : "GENERIC"}
                                                </div>
                                                <h3 className="text-lg font-bold text-white leading-tight">{p.title}</h3>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${p.status === 'Active' ? 'bg-blue-500/10 text-blue-500' : p.status === 'Executed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                {p.status}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="text-green-500 uppercase">For: {p.for.toLocaleString()}</span>
                                                <span className="text-red-500 uppercase">Against: {p.against.toLocaleString()}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-green-500" style={{ width: `${(p.for / (p.for + p.against + 0.0001)) * 100}%` }}></div>
                                                <div className="h-full bg-red-500" style={{ width: `${(p.against / (p.for + p.against + 0.0001)) * 100}%` }}></div>
                                            </div>

                                            {p.status === 'Pending Execution' ? (
                                                <button onClick={() => handleExecute(p.id)} className="w-full py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-all">Tally & Execute</button>
                                            ) : votedProposals[p.id] ? (
                                                <div className="text-center py-2 bg-gray-800/50 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    ✓ Participation Recorded
                                                </div>
                                            ) : p.status === 'Active' ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleVote(p.id, true)} className="flex-1 py-2 rounded-lg bg-green-600/10 hover:bg-green-600/20 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-600/20 transition-all">Support</button>
                                                    <button onClick={() => handleVote(p.id, false)} className="flex-1 py-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-600/20 transition-all">Oppose</button>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl sticky top-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-2">New Proposal</h2>
                            <p className="text-xs text-gray-500 mb-6 font-medium">Locked stake is required to participate in governance.</p>
                            
                            <form onSubmit={handleCreateProposal} className="space-y-4">
                                <textarea 
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white text-sm focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-gray-700"
                                    placeholder="Draft your decentralized proposal..."
                                    rows="6"
                                    value={proposalText}
                                    onChange={e => setProposalText(e.target.value)}
                                    required
                                />
                                <button 
                                    type="submit"
                                    disabled={staked === "0"}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl ${staked !== "0" ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                                >
                                    Broadcast Proposal
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default TrustDAO;
