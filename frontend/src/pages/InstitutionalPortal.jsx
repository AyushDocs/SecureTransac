import { useState } from 'react';
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
            const TokenArtifact = await import("../contracts/SecureTransacToken.json"); 
            const DaoArtifact = await import("../contracts/TrustDAO.json");

            const tokenData = TokenArtifact.default.networks[netId] || TokenArtifact.default.networks[5777];
            const daoData = DaoArtifact.default.networks[netId] || DaoArtifact.default.networks[5777];
            
            if (!tokenData) throw new Error("TRUST Token not deployed");
            if (!daoData) throw new Error("TrustDAO not deployed");
            
            const token = new w3.eth.Contract(TokenArtifact.default.abi, tokenData.address);
            const dao = new w3.eth.Contract(DaoArtifact.default.abi, daoData.address);

            const weiAmount = w3.utils.toWei(stakeAmountStr, 'ether'); 

            // 3. Check Balance
            const balance = await token.methods.balanceOf(user.address).call();
            if (BigInt(balance) < BigInt(weiAmount)) {
                 throw new Error(`Insufficient TRUST balance. Have ${w3.utils.fromWei(balance, 'ether')}, Need ${stakeAmountStr}.`);
            }

            // 4. Approve DAO
            console.log(`Approving ${stakeAmountStr} TRUST for DAO...`);
            await token.methods.approve(daoData.address, weiAmount).send({ from: user.address });

            // 5. Submit Proposal
            console.log(`Submitting DAO Proposal for Tier ${tierIndex}...`);
            const desc = `Application for ${bizInfo.tier} Authority by ${bizInfo.name}`;
            await dao.methods.submitKYBProposal(tierIndex, desc).send({ from: user.address });

            setStatus('approved'); // Reuses existing success UI
            alert(`Proposal Submitted! ${stakeAmountStr} TRUST locked. Please wait for DAO voting.`);
            
        } catch (error) {
            console.error(error);
            alert("Application Failed: " + (error.reason || error.message));
            setStatus('idle');
        }
    };

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
                                            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">GSTIN / PAN Number</label>
                                        <input 
                                            type="text" 
                                            placeholder="22AAAAA0000A1Z5"
                                            value={bizInfo.taxId}
                                            onChange={e => setBizInfo({...bizInfo, taxId: e.target.value})}
                                            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-blue-500"
                                            required
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
                                            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Target Authority Tier</label>
                                        <select 
                                            value={bizInfo.tier}
                                            onChange={e => setBizInfo({...bizInfo, tier: e.target.value})}
                                            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="INSTITUTIONAL">Institutional (5,000 TRUST Stake)</option>
                                            <option value="DIAMOND">Diamond Bank Tier (50,000 TRUST Stake)</option>
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
                                        <p className="text-gray-600 text-[10px]">Lock $TRUST to activate Diamond/Institutional reporting status.</p>
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
                                        <span className="text-blue-400 font-mono">5k TRUST</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400">
                                        <strong className="text-white">4x Weight</strong> in scoring. Can issue attestations. Governance voting rights.
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-blue-500/20">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-cyan-400 font-bold">Diamond Authority</span>
                                        <span className="text-cyan-400 font-mono">50k TRUST</span>
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
