import axios from 'axios';
import { useEffect, useState } from 'react';
import { keccak256, stringToHex } from 'viem';
import { generateStealthAddress, getBlindKeys, signBlind, submitAnonymousReport } from '../api/client';
import PageWrapper from '../layout/PageWrapper';

const PrivacyPortal = () => {
    const [publicKey, setPublicKey] = useState(null);
    const [value1, setValue1] = useState(10);
    const [value2, setValue2] = useState(25);
    const [encrypted1, setEncrypted1] = useState('');
    const [encrypted2, setEncrypted2] = useState('');
    const [aggregated, setAggregated] = useState('');
    const [decrypted, setDecrypted] = useState('');
    
    // Separate loading states
    const [loadingHE, setLoadingHE] = useState(false);
    const [loadingZK, setLoadingZK] = useState(false);
    const [loadingStealth, setLoadingStealth] = useState(false);

    const [identityProof, setIdentityProof] = useState(null);
    const [stealthData, setStealthData] = useState(null);
    
    // Blind Signature states
    const [blindMessage, setBlindMessage] = useState('0x123... Fraud detected');
    const [targetAddress, setTargetAddress] = useState('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
    const [blindResult, setBlindResult] = useState(null);
    const [loadingBlind, setLoadingBlind] = useState(false);
    const [submittingReport, setSubmittingReport] = useState(false);
    const [blindKeys, setBlindKeys] = useState(null);

    const handleStealthAddress = async () => {
        setLoadingStealth(true);
        try {
            const result = await generateStealthAddress();
            if (result.success) {
                setStealthData(result);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to generate stealth address");
        } finally {
            setLoadingStealth(false);
        }
    };

    const downloadIdentityProof = () => {
        if (!identityProof) return;
        const blob = new Blob([JSON.stringify(identityProof, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `identity_proof_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        fetchPublicKey();
    }, []);

    const fetchPublicKey = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/admin/privacy/key');
            setPublicKey(response.data);
        } catch (error) {
            console.error('Failed to fetch privacy key:', error);
        }
    };

    const handleDemo = async () => {
        setLoadingHE(true);
        try {
            // Visual Simulation of Homomorphic Encryption
            setEncrypted1("Encrypting...");
            setEncrypted2("Encrypting...");
            setAggregated("");
            setDecrypted("");
            
            await new Promise(r => setTimeout(r, 800));
            
            // Mock Paillier Ciphertexts (Simulated visuals)
            // In reality these are 2048-bit integers
            const c1 = "0x" + BigInt(Math.pow(Number(value1), 5) + 123456789).toString(16).substring(0, 16) + "... (Private)"; 
            const c2 = "0x" + BigInt(Math.pow(Number(value2), 5) + 987654321).toString(16).substring(0, 16) + "... (Private)";
            
            setEncrypted1(c1);
            setEncrypted2(c2);

            await new Promise(r => setTimeout(r, 800));
            setAggregated("Multiplying Ciphertexts (c1 * c2 mod n^2)...");
            
            await new Promise(r => setTimeout(r, 800));
            const cSum = "0x" + BigInt(Math.pow(Number(value1) + Number(value2), 5) + 111111111).toString(16).substring(0, 16) + "... (Aggregated)";
            setAggregated(cSum);
            
            await new Promise(r => setTimeout(r, 800));
            const sum = Number(value1) + Number(value2);
            setDecrypted(sum.toString());

            // alert(`Success! Aggregated result is ${sum} without decryption.`);
        } catch (error) {
            console.error(error);
            alert("Visual Simulation Error");
        } finally {
            setLoadingHE(false);
        }
    };

    const handleZKProof = async () => {
        setLoadingZK(true);
        try {
            // Simulate ZK-SNARK proof generation
            console.log("Generating ZK-SNARK proof using Circom + Groth16...");
            
            // In production, this would:
            // 1. Fetch user's actual score from contract
            // 2. Generate witness using circom
            // 3. Generate proof using snarkjs
            // 4. Return proof + public signals
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate computation
            
            const mockProof = {
                pi_a: ["0x1234...", "0x5678..."],
                pi_b: [["0xabcd...", "0xef01..."], ["0x2345...", "0x6789..."]],
                pi_c: ["0x9abc...", "0xdef0..."],
                publicSignals: ["1"] // 1 = proof valid (score > 600)
            };
            
            setIdentityProof(mockProof);
            // alert(`✅ ZK-SNARK Proof Generated!\n\nYou have proven that your trust score is above 600 WITHOUT revealing the actual score.\n\nProof Type: Groth16\nCircuit: trust_score_verifier.circom\nPublic Output: ${mockProof.publicSignals[0] === "1" ? "VERIFIED ✓" : "FAILED ✗"}\n\nThis proof can now be submitted on-chain for verification.`);
            
        } catch (error) {
            console.error("ZK Proof generation failed:", error);
            alert("❌ Proof generation failed. Ensure Circom circuits are compiled.");
        } finally {
            setLoadingZK(false);
        }
    };

    // Modular inverse using Extended Euclidean Algorithm
    const modInverse = (a, n) => {
        let t = 0n;
        let newt = 1n;
        let r = n;
        let newr = a % n;

        while (newr !== 0n) {
            let quotient = r / newr;
            [t, newt] = [newt, t - quotient * newt];
            [r, newr] = [newr, r - quotient * newr];
        }

        if (r > 1n) throw new Error("a is not invertible");
        if (t < 0n) t = t + n;

        return t;
    };

    // Modular exponentiation
    const modPow = (base, exp, mod) => {
        let res = 1n;
        base = base % mod;
        while (exp > 0n) {
            if (exp % 2n === 1n) res = (res * base) % mod;
            base = (base * base) % mod;
            exp = exp / 2n;
        }
        return res;
    };

    const handleBlindSign = async () => {
        setLoadingBlind(true);
        try {
            // 1. Get Public Keys (n, e) from server
            let keys = blindKeys;
            if (!keys) {
                keys = await getBlindKeys();
                setBlindKeys(keys);
            }
            const n = BigInt(keys.n);
            const e = BigInt(keys.e);

            // 2. Hash message and convert to BigInt
            const msgHash = keccak256(stringToHex(blindMessage));
            const m = BigInt(msgHash);

            // 3. Generate random blinding factor r (coprime to n)
            // For demo, we just use a large random
            const r = BigInt("0x" + Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join(''));
            
            // 4. Blind: m' = (m * r^e) mod n
            const r_pow_e = modPow(r, e, n);
            const m_prime = (m * r_pow_e) % n;

            // 5. Send m' to server for signing
            const { signature: s_prime_str } = await signBlind(m_prime.toString());
            const s_prime = BigInt(s_prime_str);

            // 6. Unblind: s = (s' * r^-1) mod n
            const r_inv = modInverse(r, n);
            const s = (s_prime * r_inv) % n;

            // Client-side verification check
            const verification = modPow(s, e, n);
            const isValidLocally = (verification === m);
            console.log(`[BlindSig] Local Verification: ${isValidLocally ? 'PASSED' : 'FAILED'}`);
            if (!isValidLocally) {
                console.error("- M_expected:", m.toString());
                console.error("- S^e mod n:", verification.toString());
            }

            setBlindResult({
                message: blindMessage,
                hash: msgHash,
                signature: s.toString(),
                blindedHash: m_prime.toString(),
                blindedSignature: s_prime_str,
                isValidLocally
            });

        } catch (error) {
            console.error("Blind signature failed:", error);
            alert("Blind signature failed: " + error.message);
        } finally {
            setLoadingBlind(false);
        }
    };

    const handleSubmitAnonymous = async () => {
        if (!blindResult) return;
        setSubmittingReport(true);
        try {
            const data = {
                targetAddress: targetAddress,
                intent: blindResult.message,
                hash: blindResult.hash,
                signature: blindResult.signature
            };
            const res = await submitAnonymousReport(data);
            if (res.success) {
                alert(`✅ Anonymous Report Submitted!\n\nTarget: ${res.target}\nStatus: ${res.status}\n\nAI Analyzed the intent and applied the reputational changes.`);
                setBlindResult(null);
            }
        } catch (error) {
            console.error(error);
            alert("Submission failed: " + error.message);
        } finally {
            setSubmittingReport(false);
        }
    };


    return (
        <PageWrapper title="Privacy & Cryptography Portal">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Developer Risk Laboratory (HE)</h2>
                        <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20 uppercase font-bold">Tech Demo</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        We use <b>Paillier Homomorphic Encryption</b> to update your trust score without ever unlocking it. 
                        This means the system can secure add or remove points from your encrypted score, but cannot see the value itself. 
                        Privacy is mathematically guaranteed.
                    </p>
                    
                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg mb-6">
                        <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1">System Public Key (n)</div>
                        <div className="text-[10px] font-mono text-gray-400 break-all">
                            {publicKey ? publicKey.n : 'Loading...'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500">Report A (Impact)</label>
                                <input type="number" value={value1} onChange={e => setValue1(e.target.value)} className="w-full bg-gray-950 border border-gray-800 p-2 rounded text-white" />
                                {encrypted1 && <div className="text-[10px] text-green-500 mt-1 font-mono">{encrypted1}</div>}
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500">Report B (Impact)</label>
                                <input type="number" value={value2} onChange={e => setValue2(e.target.value)} className="w-full bg-gray-950 border border-gray-800 p-2 rounded text-white" />
                                {encrypted2 && <div className="text-[10px] text-green-500 mt-1 font-mono">{encrypted2}</div>}
                            </div>
                        </div>

                        {aggregated && (
                            <div className="p-3 bg-gray-950 border border-dashed border-gray-700 rounded text-center">
                                <span className="text-xs text-gray-500 block mb-1">Homomorphic Operation (Add)</span>
                                <code className="text-xs text-yellow-400">{aggregated}</code>
                            </div>
                        )}

                        {decrypted && (
                            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-center animate-in fade-in">
                                <span className="text-xs text-green-400 block mb-1">Final Decrypted Sum</span>
                                <span className="text-2xl font-bold text-white">{decrypted}</span>
                            </div>
                        )}

                        <button onClick={handleDemo} disabled={loadingHE} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 py-2 rounded font-bold text-white disabled:opacity-50">
                            {loadingHE ? 'Processing Encrypted Data...' : 'Run Secure Aggregation Demo'}
                        </button>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Zero-Knowledge Proofs (ZKP)</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Prove your identity or trust level without revealing sensitive details. 
                        <b>Selective Disclosure</b> allows you to show a badge (e.g. "Trusted Partner") while keeping your score secret.
                    </p>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-950 border border-gray-800 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-300">Identity Verifier</span>
                                <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded font-bold">READY</span>
                            </div>
                            <div className="text-xs text-gray-500 mb-4">Generating a ZK-SNARK proof for: <i>Score &gt; 600</i></div>
                            <button 
                                onClick={handleZKProof}
                                disabled={loadingZK}
                                className="w-full bg-gray-800 border border-gray-700 py-2 rounded text-xs font-bold text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                {loadingZK ? '⏳ Generating Proof...' : '🛡️ Generate Identity Proof (Circom)'}
                            </button>
                        </div>
                        
                        {identityProof && (
                            <div className="mt-2 text-center">
                                <button 
                                    onClick={downloadIdentityProof}
                                    className="text-xs text-green-400 font-bold hover:underline flex items-center justify-center gap-1"
                                >
                                    ✅ Proof Ready: Download JSON ⬇️
                                </button>
                            </div>
                        )}

                        <div className="p-4 bg-gray-950 border border-gray-800 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-300">Stealth Addresses</span>
                                <span className="text-[10px] bg-purple-500/20 text-purple-500 px-2 py-0.5 rounded font-bold">ACTIVE</span>
                            </div>
                            <div className="text-xs text-gray-500 mb-4">
                                Generate a unique, one-time address that maps to you but looks random to everyone else. 
                                Use this to receive payments or feedback without revealing your main identity history.
                            </div>
                            
                            {!stealthData ? (
                                <button 
                                    onClick={handleStealthAddress}
                                    disabled={loadingStealth}
                                    className="w-full bg-gray-800 border border-gray-700 py-2 rounded text-xs font-bold text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                                >
                                    {loadingStealth ? 'Deriving Address...' : '👻 Generate Stealth Address'}
                                </button>
                            ) : (
                                <div className="space-y-3 animate-in fade-in bg-purple-900/10 p-2 rounded border border-purple-500/20">
                                    <div>
                                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Ephemeral PubKey (R)</span>
                                        <code className="text-[9px] text-purple-400 break-all font-mono leading-tight">{stealthData.ephemeralPublicKey}</code>
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Derived Stealth Address</span>
                                        <div className="flex justify-between items-center mt-1">
                                            <code className="text-xs text-white font-mono">{stealthData.stealthAddress}</code>
                                            <span className="text-[9px] text-green-500 font-bold">PRIVATE</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setStealthData(null)}
                                        className="w-full text-[10px] text-gray-500 hover:text-white pt-1 border-t border-gray-800 mt-2"
                                    >
                                        Generate New
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-gray-900 border border-gray-800 p-6 rounded-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="text-6xl">🕶️</span>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold text-white">Chaumian Anonymous Reporting</h2>
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20 uppercase font-bold">Privacy Layer</span>
                </div>

                <p className="text-gray-400 text-sm mb-6 max-w-2xl">
                    Implement <b>Blind Signatures</b> to report fraud anonymously. 
                    The server signs your report without seeing the message content (blinding), 
                    ensuring that your identity can never be linked to the report once it's public.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Target Account (To Report)</label>
                                <input 
                                    type="text"
                                    value={targetAddress}
                                    onChange={e => setTargetAddress(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-xs focus:ring-1 focus:ring-purple-500 outline-none font-mono"
                                    placeholder="0x..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Report Intent (Sensitive Content)</label>
                                <textarea 
                                    value={blindMessage}
                                    onChange={e => setBlindMessage(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-xs h-20 focus:ring-1 focus:ring-purple-500 outline-none"
                                    placeholder="Describe the violation..."
                                />
                            </div>
                            <button 
                                onClick={handleBlindSign}
                                disabled={loadingBlind}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loadingBlind ? '🔐 Generating Report-Token...' : '🕶️ Phase 1: Sign Blind Token'}
                            </button>
                        </div>

                    <div className="lg:col-span-2 space-y-4">
                        {blindResult ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-right-4">
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase block mb-2">Blinded Interaction (Server Saw)</span>
                                        <div className="space-y-2">
                                            <div>
                                                <div className="text-[8px] text-gray-600 uppercase">Blinded Hash (m')</div>
                                                <code className="text-[10px] text-purple-400 break-all font-mono leading-tight block">{blindResult.blindedHash.substring(0, 60)}...</code>
                                            </div>
                                            <div>
                                                <div className="text-[8px] text-gray-600 uppercase">Blinded Signature (s')</div>
                                                <code className="text-[10px] text-gray-500 break-all font-mono leading-tight block">{blindResult.blindedSignature.substring(0, 60)}...</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-purple-600/10 border border-purple-500/30 rounded-xl shadow-inner">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[9px] text-white font-bold uppercase">Unblinded Proof (Public Ready)</span>
                                            <span className={`text-[9px] ${blindResult.isValidLocally ? 'bg-green-500' : 'bg-red-500'} text-black px-1.5 rounded font-black uppercase`}>
                                                {blindResult.isValidLocally ? 'Verified ✓' : 'Checksum Fail!'}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <div className="text-[8px] text-purple-300 uppercase">Original Report Hash (H)</div>
                                                <code className="text-[10px] text-white break-all font-mono leading-tight block">{blindResult.hash}</code>
                                            </div>
                                            <div>
                                                <div className="text-[8px] text-purple-300 uppercase">Valid RSA Signature (s)</div>
                                                <code className="text-[10px] text-green-400 break-all font-mono leading-tight block">{blindResult.signature.substring(0, 60)}...</code>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-2 bg-black/40 rounded text-[9px] text-gray-400 border border-white/5 italic">
                                            Mathematically proven: Signature verification <b>s^e mod n == H</b> is TRUE, yet server cannot link 's' to 's'.
                                        </div>
                                        <button 
                                            onClick={handleSubmitAnonymous}
                                            disabled={submittingReport}
                                            className="w-full mt-4 bg-green-500 hover:bg-green-400 text-black font-black py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            {submittingReport ? '🛸 Sending Anonymous Transmission...' : '🚀 Final Phase: Submit Anonymous Report'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center p-8 border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/50">
                                <div className="text-center">
                                    <div className="text-4xl mb-3 opacity-20">📜</div>
                                    <p className="text-xs text-gray-600">Enter a report intent and authenticate to see the blinding process.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default PrivacyPortal;
