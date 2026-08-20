import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../layout/PageWrapper';
const InstitutionalPortal = () => {
    const { user } = useAuth();
    const [bizInfo, setBizInfo] = useState({ 
        name: '', 
        taxId: '', 
        lei: '', 
        jurisdiction: 'Global',
        tier: 'INSTITUTIONAL'
    });
    const [docs, setDocs] = useState([]);
    const [upgradeMode, setUpgradeMode] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState(null); // { id, status, forVotes, againstVotes, endTime, executed }
    const [loadingStatus, setLoadingStatus] = useState(true);


    
    // Check for existing application
    useEffect(() => {
        if (user?.address) checkApplicationStatus();
    }, [user?.address]);

    async function checkApplicationStatus() {
        try {
            const w3 = new (await import("web3")).default(window.ethereum);
            const netId = await w3.eth.net.getId();
            const DaoArtifact = await import("../contracts/TrustDAO.json");
            const daoData = DaoArtifact.default.networks[netId] || DaoArtifact.default.networks[5777];
            
            if (!daoData) return;
            const dao = new w3.eth.Contract(DaoArtifact.default.abi, daoData.address);
            
            const nextId = await dao.methods.nextProposalId().call();
            let latestApp = null;

            // Iterate backwards to find latest application
            console.log("Checking proposals... Count:", nextId);
            for (let i = Number(nextId) - 1; i >= 0; i--) {
                const p = await dao.methods.proposals(i).call();
                console.log(`Proposal ${i}:`, p.proposer, p.pType, user.address);
                if (p.proposer.toLowerCase() === user.address.toLowerCase() && (p.pType == 1 || p.pType === "1")) { // KYB_ADMISSION
                    console.log("Found Match!", p);
                    latestApp = {
                        id: p.id,
                        status: p.executed ? "Executed" : (Date.now() > Number(p.endTime) * 1000 ? "Pending Execution" : "Active"),
                        forVotes: parseFloat(w3.utils.fromWei(p.forVotes, 'ether')),
                        againstVotes: parseFloat(w3.utils.fromWei(p.againstVotes, 'ether')),
                        endTime: Number(p.endTime) * 1000,
                        executed: p.executed,
                        targetTier: p.targetTier,
                        description: p.description
                    };
                    break;
                }
            }
            setApplicationStatus(latestApp);
            
            // Pre-fill if upgrading
            if (latestApp?.executed) {
                 const match = latestApp.description.match(/by (.*)/);
                 if (match && match[1]) {
                     setBizInfo(prev => ({ 
                         ...prev, 
                         name: match[1],
                         taxId: '******', // Masked for security/demo
                         lei: '******'
                     }));
                 }
            }
            
            setLoadingStatus(false);
        } catch (e) {
            console.error("Failed to check status", e);
            setLoadingStatus(false);
        }
    }

    const [status, setStatus] = useState('idle');

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDocs([...docs, file.name]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        
        try {
            if (!user?.address) throw new Error("Wallet not connected");

            const { web3, contract } = window.web3Container || {};
            // Note: We use the local web3 instance we ensure below

            const Web3 = (await import("web3")).default;
            const w3 = new Web3(window.ethereum);

            // 1. Determine Tier & Cost
            const tierIndex = bizInfo.tier === 'INSTITUTIONAL' ? 2 : 3;
            const stakeAmountStr = bizInfo.tier === 'INSTITUTIONAL' ? "5000" : "50000"; 
            
            const netId = await w3.eth.net.getId();
            
            // 2. Load Contracts
            const TokenArtifact = await import("../contracts/AVToken.json"); 
            const DaoArtifact = await import("../contracts/TrustDAO.json");

            const tokenData = TokenArtifact.default.networks[netId] || TokenArtifact.default.networks[5777];
            const daoData = DaoArtifact.default.networks[netId] || DaoArtifact.default.networks[5777];
            
            if (!tokenData) throw new Error("AV Token not deployed");
            if (!daoData) throw new Error("TrustDAO not deployed");
            
            const token = new w3.eth.Contract(TokenArtifact.default.abi, tokenData.address);
            const dao = new w3.eth.Contract(DaoArtifact.default.abi, daoData.address);

            const weiAmount = w3.utils.toWei(stakeAmountStr, 'ether'); 

            // 3. Check Balance
            const balance = await token.methods.balanceOf(user.address).call();
            if (BigInt(balance) < BigInt(weiAmount)) {
                 throw new Error(`Insufficient AV balance. Have ${w3.utils.fromWei(balance, 'ether')}, Need ${stakeAmountStr}.`);
            }

            // 4. Approve DAO
            console.log(`Approving ${stakeAmountStr} AV for DAO...`);
            await token.methods.approve(daoData.address, weiAmount).send({ from: user.address });

            // 5. Submit Proposal
            console.log(`Submitting DAO Proposal for Tier ${tierIndex}...`);
            const desc = `Application for ${bizInfo.tier} Authority by ${bizInfo.name}`;
            await dao.methods.submitKYBProposal(tierIndex, desc).send({ from: user.address });

            // Success Handling
            alert(`Proposal Submitted! ${stakeAmountStr} AV locked. Please wait for DAO voting.`);
            setUpgradeMode(false); // Reset upgrade mode
            setStatus('idle');
            setLoadingStatus(true);
            await checkApplicationStatus(); // Refresh status
            
        } catch (error) {
            console.error(error);
            alert("Application Failed: " + (error.reason || error.message));
            setStatus('idle');
        }
    };

    if (loadingStatus) return <PageWrapper><div className="p-10 text-center text-white">Loading Membership Status...</div></PageWrapper>;

    const isApplied = applicationStatus != null;
    const isApproved = applicationStatus?.status === 'Executed' && applicationStatus.forVotes > applicationStatus.againstVotes;

    // Show Upgrade Form if requested
    const showUpgradeForm = upgradeMode || (!isApplied && !isApproved);

    if (isApproved && !upgradeMode) {
        const isDiamond = applicationStatus.targetTier == 3;
        return (
            <PageWrapper title="Institutional Portal">
                <div className="max-w-4xl mx-auto text-center py-12">
                     <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-12">
                        <div className="text-6xl mb-6">🏛️</div>
                        <h2 className="text-4xl font-black text-white mb-4">Membership Active</h2>
                        <p className="text-xl text-green-400 font-bold mb-8">You are a verified {isDiamond ? 'Diamond' : 'Institutional'} Authority.</p>
                        <div className="grid grid-cols-3 gap-6 text-left max-w-2xl mx-auto mb-8">
                            <div className="bg-gray-900 p-4 rounded-xl">
                                <span className="text-xs text-gray-500 uppercase font-bold">Current Tier</span>
                                <div className="text-white font-bold">{isDiamond ? 'Diamond 💎' : 'Institutional'}</div>
                            </div>
                            <div className="bg-gray-900 p-4 rounded-xl">
                                <span className="text-xs text-gray-500 uppercase font-bold">Reputation Weight</span>
                                <div className="text-white font-bold">{isDiamond ? '10.0x' : '4.0x'}</div>
                            </div>
                            <div className="bg-gray-900 p-4 rounded-xl">
                                <span className="text-xs text-gray-500 uppercase font-bold">Governance</span>
                                <div className="text-white font-bold">Voting Enabled</div>
                            </div>
                        </div>
                    </div>

                        <div className="mt-10 bg-gray-900 border border-gray-800 rounded-3xl p-8 text-left max-w-2xl mx-auto shadow-inner">
                            <h3 className="text-sm font-black text-gray-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                Compliance & Identity Management
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all group">
                                    <div className="text-white font-bold text-sm mb-1 group-hover:text-blue-400 transition-colors">Tax ID & LEI</div>
                                    <div className="text-[10px] text-gray-600 font-mono uppercase">Identity Record Locked</div>
                                </div>
                                <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all group cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-white font-bold text-sm mb-1 group-hover:text-green-400 transition-colors">Registration Docs</div>
                                            <div className="text-[10px] text-gray-600 font-mono uppercase">Last Sync: Today</div>
                                        </div>
                                        <span className="text-xs">🔄</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-8 border-2 border-dashed border-gray-800 rounded-2xl text-center hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer group">
                                <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">📄</span>
                                <p className="text-gray-400 text-sm font-bold">Submit Updated Business Documents</p>
                                <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-tighter">Existing IDs will be preserved. Only proofs will be updated.</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            {!isDiamond && (
                            <button 
                                onClick={() => {
                                    setBizInfo(prev => ({ ...prev, tier: 'DIAMOND' }));
                                    setUpgradeMode(true);
                                }}
                                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
                            >
                                Upgrade to Diamond Tier 💎
                            </button>
                        )}
                     </div>
                </div>
            </PageWrapper>
        );
    }

    if (isApplied && !upgradeMode) {
        return (
             <PageWrapper title="Application Status">
                <div className="max-w-2xl mx-auto py-12">
                     <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-white">Application #{applicationStatus.id}</h2>
                                <p className="text-gray-400">Institutional Tier Admission</p>
                            </div>
                            <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg font-bold uppercase text-xs animate-pulse">
                                {applicationStatus.status}
                            </span>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-green-500 font-bold">Support: {applicationStatus.forVotes.toLocaleString()}</span>
                                    <span className="text-red-500 font-bold">Oppose: {applicationStatus.againstVotes.toLocaleString()}</span>
                                </div>
                                <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${(applicationStatus.forVotes / (applicationStatus.forVotes + applicationStatus.againstVotes + 0.0001)) * 100}%` }}></div>
                                    <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${(applicationStatus.againstVotes / (applicationStatus.forVotes + applicationStatus.againstVotes + 0.0001)) * 100}%` }}></div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-950 p-6 rounded-xl border border-gray-800">
                                <p className="text-sm text-gray-400 mb-2">
                                    Your application is currently under governance review. Token holders are voting on your admission based on the documents provided.
                                </p>
                                <div className="text-xs text-gray-500 font-mono">
                                    Voting Ends: {new Date(applicationStatus.endTime).toLocaleString()}
                                </div>
                                
                                {applicationStatus.status === 'Pending Execution' && (
                                    <button 
                                        onClick={async () => {
                                            try {
                                                const w3 = new (await import("web3")).default(window.ethereum);
                                                const netId = await w3.eth.net.getId();
                                                const DaoArtifact = await import("../contracts/TrustDAO.json");
                                                const daoData = DaoArtifact.default.networks[netId] || DaoArtifact.default.networks[5777];
                                                const dao = new w3.eth.Contract(DaoArtifact.default.abi, daoData.address);
                                                
                                                await dao.methods.executeProposal(applicationStatus.id).send({ from: user.address });
                                                alert("Application Finalized!");
                                                window.location.reload();
                                            } catch(e) {
                                                alert("Error: " + e.message);
                                            }
                                        }}
                                        className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                                    >
                                        Finalize Application & Activate Status
                                    </button>
                                )}
                            </div>
                        </div>
                     </div>
                </div>
             </PageWrapper>
        );
    }

    // Default (Application Form)
    return (
        <PageWrapper title="Institutional KYB Portal">
            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
                            <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                                <span className="text-blue-500">🏢</span> Business Onboarding
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Upgrade your Business to Institutional Tier/Diamond Tier
                            </p>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Legal Entity Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="SecurePay Inc."
                                            value={bizInfo.name}
                                            onChange={e => setBizInfo({...bizInfo, name: e.target.value})}
                                            className={`w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-blue-500 ${upgradeMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            required
                                            disabled={upgradeMode}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">GSTIN / PAN Number</label>
                                        <input 
                                            type="text" 
                                            placeholder="22AAAAA0000A1Z5"
                                            value={bizInfo.taxId}
                                            onChange={e => setBizInfo({...bizInfo, taxId: e.target.value})}
                                            className={`w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-blue-500 ${upgradeMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            required
                                            disabled={upgradeMode}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">CIN / UDYAM / LEI</label>
                                        <input 
                                            type="text" 
                                            placeholder="U12345MH2023PTC123456"
                                            value={bizInfo.lei}
                                            onChange={e => setBizInfo({...bizInfo, lei: e.target.value})}
                                            className={`w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-blue-500 ${upgradeMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={upgradeMode}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Target Authority Tier</label>
                                        <select 
                                            value={bizInfo.tier}
                                            onChange={e => setBizInfo({...bizInfo, tier: e.target.value})}
                                            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-blue-500"
                                        >
                                            {(!applicationStatus?.executed || applicationStatus.targetTier < 2) && (
                                                <option value="INSTITUTIONAL">Institutional (5,000 AV Stake)</option>
                                            )}
                                            <option value="DIAMOND">Diamond Bank Tier (50,000 AV Stake)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Compliance Documents</label>
                                    <div className="border-2 border-dashed border-gray-800 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                                        <input type="file" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        <div className="text-4xl mb-2">📁</div>
                                        <p className="text-gray-400 text-sm">Upload GST Certificate, CIN, MOA, or Udyam Registration</p>
                                        <p className="text-[10px] text-gray-600 mt-2">Files are encrypted and pinned to IPFS Private Clusters</p>
                                    </div>
                                    {docs.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {docs.map(d => (
                                                <span key={d} className="bg-blue-600/10 text-blue-500 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-500/20">{d} ✓</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button 
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                                    disabled={status === 'submitting'}
                                >
                                    {status === 'submitting' ? 'INITIATING ON-CHAIN KYB...' : 'PROPOSE INSTITUTIONAL MEMBERSHIP'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="space-y-6">
                        <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
                            <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Verification Flow</h3>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white shrink-0">1</div>
                                    <div>
                                        <h4 className="text-white text-xs font-bold">Document Submission</h4>
                                        <p className="text-gray-500 text-[10px]">Encrypt and pin business identities to IPFS.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] text-white shrink-0 text-gray-500">2</div>
                                    <div>
                                        <h4 className="text-gray-400 text-xs font-bold">DAO Proposal</h4>
                                        <p className="text-gray-600 text-[10px]">Token holders review docs and vote on your admission.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] text-white shrink-0 text-gray-500">3</div>
                                    <div>
                                        <h4 className="text-gray-400 text-xs font-bold">Stake Activation</h4>
                                        <p className="text-gray-600 text-[10px]">Lock $AV to activate Diamond/Institutional reporting status.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl">
                            <h3 className="text-blue-500 font-bold mb-4 uppercase text-xs tracking-widest">Authority Tier Structure</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400 font-bold">Standard Business</span>
                                        <span className="text-gray-600">No Stake</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500">Verified identity. access to basic scores. 1x Reputation Weight.</p>
                                </div>

                                <div className="pt-3 border-t border-blue-500/20">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-white font-bold">Institutional Authority</span>
                                        <span className="text-blue-400 font-mono">5k AV</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400">
                                        <strong className="text-white">4x Weight</strong> in scoring. Can issue attestations. Governance voting rights.
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-blue-500/20">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-cyan-400 font-bold">Diamond Authority</span>
                                        <span className="text-cyan-400 font-mono">50k AV</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400">
                                        <strong className="text-white">10x Weight</strong>. Priority bridge access. Revenue share from verification fees.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default InstitutionalPortal;
