const { Web3 } = require('web3');
const paillier = require('paillier-bigint');
const fs = require('fs');
const path = require('path');
const KEYS_FILE_PATH = path.join(__dirname, '../../paillier_keys.json');
const TrustRegistry = require('../../../onchain/build/contracts/TrustRegistry.json');
const IdentityVault = require('../../../onchain/build/contracts/IdentityVault.json');
const VerificationRegistry = require('../../../onchain/build/contracts/VerificationRegistry.json');
const cacheService = require('./cacheService');

// Force restart for new contracts

class Web3Service {
    constructor() {
        try {
            this.web3 = new Web3(process.env.PROVIDER_URL || 'http://127.0.0.1:7545');
            this.paillier = paillier;
            
            // Priority: Env variables -> Networks from JSON -> Fallbacks
            this.registryAddress = process.env.REGISTRY_ADDRESS;
            this.vaultAddress = process.env.VAULT_ADDRESS;
            this.verificationAddress = process.env.VERIFICATION_ADDRESS;
            
            const networks = Object.keys(TrustRegistry.networks);
            const targetNetworkId = process.env.NETWORK_ID || (networks.length > 0 ? networks[networks.length - 1] : "1337");

            // Automatic discovery if not in .env
            if (!this.registryAddress) this.registryAddress = TrustRegistry.networks[targetNetworkId]?.address;
            if (!this.vaultAddress) this.vaultAddress = IdentityVault.networks[targetNetworkId]?.address;
            if (!this.verificationAddress) this.verificationAddress = VerificationRegistry.networks[targetNetworkId]?.address;

            // Global Hardcode Fallbacks (Last resort)
            if (!this.registryAddress) this.registryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
            if (!this.vaultAddress) this.vaultAddress = "0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8";
            if (!this.verificationAddress) this.verificationAddress = "0x851356ae760d987E095750cCeb3bC6014560891C";

            console.log(`[Web3] System Initialization on Network ${targetNetworkId}`);
            console.log(`[Web3] Addresses: Registry=${this.registryAddress}, Vault=${this.vaultAddress}, Verification=${this.verificationAddress}`);

            const privateKey = process.env.ADMIN_PRIVATE_KEY;
            if (privateKey) {
                this.adminAccount = this.web3.eth.accounts.privateKeyToAccount(privateKey);
                this.web3.eth.accounts.wallet.add(this.adminAccount);
                console.log(`[Web3] Admin loaded: ${this.adminAccount.address}`);
            } else {
                console.warn("[Web3] ADMIN_PRIVATE_KEY not set!");
                this.adminAccount = null;
            }
            
            if (this.registryAddress) {
                this.contract = new this.web3.eth.Contract(TrustRegistry.abi, this.registryAddress);
            }
            if (this.vaultAddress) {
                this.vaultContract = new this.web3.eth.Contract(IdentityVault.abi, this.vaultAddress);
            }
            if (this.verificationAddress) {
                this.verificationContract = new this.web3.eth.Contract(VerificationRegistry.abi, this.verificationAddress);
            }

            // Validating keys persistence
            this._loadKeys();

        } catch (e) {
            console.error("[Web3] CRITICAL ERROR IN CONSTRUCTOR:", e);
        }
    }

    _loadKeys() {
        if (fs.existsSync(KEYS_FILE_PATH)) {
            try {
                const data = JSON.parse(fs.readFileSync(KEYS_FILE_PATH, 'utf8'));
                const { PublicKey, PrivateKey } = this.paillier;
                const pub = new PublicKey(BigInt(data.public.n), BigInt(data.public.g));
                const priv = new PrivateKey(BigInt(data.private.lambda), BigInt(data.private.mu), pub, BigInt(data.private.p), BigInt(data.private.q));
                this.paillierKeys = { publicKey: pub, privateKey: priv };
                console.log("[Web3] Paillier keys loaded from disk.");
                return true;
            } catch (e) {
                console.error("[Web3] Failed to load keys from disk:", e.message);
            }
        }
        return false;
    }

    _saveKeys() {
        if (!this.paillierKeys) return;
        try {
            const data = {
                public: {
                    n: this.paillierKeys.publicKey.n.toString(),
                    g: this.paillierKeys.publicKey.g.toString()
                },
                private: {
                    lambda: this.paillierKeys.privateKey.lambda.toString(),
                    mu: this.paillierKeys.privateKey.mu.toString(),
                    p: this.paillierKeys.privateKey.p.toString(),
                    q: this.paillierKeys.privateKey.q.toString(),
                }
            };
            fs.writeFileSync(KEYS_FILE_PATH, JSON.stringify(data, null, 2));
            console.log("[Web3] Paillier keys saved to disk.");
        } catch (e) {
            console.error("[Web3] Failed to save keys:", e.message);
        }
    }

    async _sendAdminTx(contractAddress, methodCall) {
        if (!this.adminAccount) throw new Error("Admin account not configured");
        const gas = await methodCall.estimateGas({ from: this.adminAccount.address });
        const signedTx = await this.web3.eth.accounts.signTransaction({
            from: this.adminAccount.address,
            to: contractAddress,
            data: methodCall.encodeABI(),
            gas: Math.floor(Number(gas) * 1.5),
            gasPrice: await this.web3.eth.getGasPrice(),
        }, process.env.ADMIN_PRIVATE_KEY);
        return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    }

    // Privacy: compliant with storing multipliable hash (homomorphic property placeholder)
    async _applyPrivacyHash(score) {
        if (!this.paillierKeys) {
            console.log("[Web3] Generating Paillier Keys (1024-bit)...");
            // keys: { publicKey, privateKey }
            this.paillierKeys = await this.paillier.generateRandomKeys(1024);
            console.log("[Web3] Paillier Keys generated.");
            this._saveKeys();
        }
        
        // Homomorphic Encryption of the score
        // Score is 0-100 integer.
        // E(m) = g^m * r^n mod n^2
        const m = Math.floor(score * 100);
        const ciphertext = this.paillierKeys.publicKey.encrypt(BigInt(m));
        
        console.log(`[Web3] Paillier Encrypted Score (Homomorphic): ${ciphertext.toString().substring(0, 64)}...`);
        return ciphertext;
    }

    async updateScore(targetAddress, score) {
        if (!this.contract || !this.adminAccount) return false;
        
        // Safety check for permissions to avoid opaque EVM reverts
        try {
            // Verify contract exists at address
            const code = await this.web3.eth.getCode(this.registryAddress);
            if (code === '0x' || code === '0x0') {
                console.error(`[Web3] CRITICAL: No contract found at ${this.registryAddress}. Your .env address might be wrong.`);
                return false;
            }

            const isAuthorized = await this.contract.methods.isAuthorizedReporter(this.adminAccount.address).call();
            if (!isAuthorized) {
                console.warn(`[Web3] Admin ${this.adminAccount.address} is not an authorized reporter.`);
                
                // Attempt Auto-Authorization if Admin is Owner
                const owner = await this.contract.methods.owner().call();
                if (owner.toLowerCase() === this.adminAccount.address.toLowerCase()) {
                    console.log("[Web3] Admin is owner. Auto-authorizing as Diamond Reporter...");
                    await this._sendAdminTx(this.registryAddress, this.contract.methods.setReporterStatus(this.adminAccount.address, true, 3));
                } else {
                    console.error("[Web3] REVERT PREVENTED: Admin lacks permissions and is not owner. Please run 'npm run seed'.");
                    return false;
                }
            }
        } catch (e) {
            console.warn("[Web3] Permission check/pre-flight failed:", e.message);
        }

        const encryptedBigInt = await this._applyPrivacyHash(score);
        
        // Full Migration: Store Paillier Ciphertext as bytes on-chain
        let encryptedHex = encryptedBigInt.toString(16);
        if (encryptedHex.length % 2) encryptedHex = '0' + encryptedHex;
        const storageValue = '0x' + encryptedHex;
        
        console.log(`[Web3] Submitting Full Paillier Ciphertext to Contract (bytes): ${storageValue.substring(0, 64)}...`);
        
        return this._sendAdminTx(this.registryAddress, this.contract.methods.updateScore(targetAddress, storageValue));
    }

    async recordTransaction(from, to, amount) {
        if (!this.contract) return false;
        return this._sendAdminTx(this.registryAddress, this.contract.methods.recordTransaction(from, to, Math.floor(amount * 100)));
    }

    async submitReport(target, reason) {
        if (!this.contract) return false;
        // Anyone can report, but we use admin here for system reports or if the user is authenticated on server
        return this._sendAdminTx(this.registryAddress, this.contract.methods.submitReport(target, reason));
    }

    async getTransactionHistory(address) {
        if (!this.contract) return [];
        const addr = address.toLowerCase();
        const [sent, received] = await Promise.all([
            this.contract.getPastEvents('TransactionLogged', { filter: { from: addr }, fromBlock: 0 }),
            this.contract.getPastEvents('TransactionLogged', { filter: { to: addr }, fromBlock: 0 })
        ]);

        const history = [...sent, ...received].map(e => ({
            type: e.returnValues.from.toLowerCase() === addr ? 'OUT' : 'IN',
            from: e.returnValues.from,
            to: e.returnValues.to,
            amount: Number(e.returnValues.amount) / 100,
            timestamp: Number(e.returnValues.timestamp) * 1000,
            txHash: e.transactionHash
        }));

        return history.sort((a, b) => b.timestamp - a.timestamp);
    }

    async getReports(targetAddress) {
        if (!this.contract) return [];
        const events = await this.contract.getPastEvents('ReportSubmitted', { 
            filter: { target: targetAddress.toLowerCase() }, 
            fromBlock: 0 
        });
        return events.map(e => ({
            reporter: e.returnValues.reporter,
            text: e.returnValues.reason,
            timestamp: Number(e.returnValues.timestamp) * 1000
        }));
    }

    async getScore(targetAddress) {
        if (!this.contract) return 500;
        try {
            // Admin view (free)
            if (this.adminAccount) {
                 return await this.contract.methods.getScore(targetAddress).call({ from: this.adminAccount.address });
            }
            // Fallback (might fail if not admin)
            return await this.contract.methods.getScore(targetAddress).call();
        } catch (error) {
            console.error("[Web3] getScore failed:", error.message);
            // In ZK mode, default cannot be 50 (plaintext). Return empty bytes or handle error.
            return '0x00';
        }
    }

    async getDecryptedScore(targetAddress) {
        try {
            const scoreHex = await this.getScore(targetAddress);
            if (!scoreHex || scoreHex === '0x00' || scoreHex === '0x') return 0;

            if (!this.paillierKeys) {
                // Try load
                if (!this._loadKeys()) {
                     console.warn("[Web3] Keys missing and no backup found. Generating NEW keys (Old data will be lost/unreadable).");
                     await this._applyPrivacyHash(0); // Trigger generation
                }
            }

            const cipherBigInt = BigInt(scoreHex);
            const decrypted = this.paillierKeys.privateKey.decrypt(cipherBigInt);
            // Decrypted is m = score * 100.
            return Number(decrypted) / 100;
        } catch (error) {
            console.error("[Web3] Decryption failed:", error);
            return 0;
        }
    }

    async getCredits(address) {
        if (!this.contract) return 0;
        try {
            // Now credits is public mapping, so we can access it via helper or direct mapping call
            // Since we are in backend service, we can likely call the public mapping getter 'credits(address)'
            // But wait, TrustRegistry inherits ScoringSystem which implements AccessControl is CreditSystem
            // So TrustRegistry has 'credits(address)' function auto-generated for public mapping.
            return await this.contract.methods.credits(address).call();
        } catch (error) {
            console.error("[Web3] getCredits failed:", error.message);
            return 0;
        }
    }

    async isReporter(address) {
        if (!this.contract) return false;
        try {
            return await this.contract.methods.isAuthorizedReporter(address).call();
        } catch (error) {
            return false;
        }
    }

    async getReporterTier(address) {
        if (!this.contract) return 0;
        try {
            return await this.contract.methods.reporterTier(address).call();
        } catch (error) {
            return 0;
        }
    }

    async setReporterStatus(reporterAddress, status, tier = 1) {
        if (!this.contract) return false;
        return this._sendAdminTx(this.registryAddress, this.contract.methods.setReporterStatus(reporterAddress, status, tier));
    }

    async getIdentityCID(userAddress) {
        if (!this.vaultContract || !this.adminAccount) return null;
        try {
            return await this.vaultContract.methods.requestData(userAddress).call({ from: this.adminAccount.address });
        } catch (error) {
            return null;
        }
    }

    // Verification Registry Methods
    async requestVerification(userAddress, companyAddress, proofCid) {
        if (!this.verificationContract) return false;
        return this._sendAdminTx(this.verificationAddress, this.verificationContract.methods.requestVerification(userAddress, companyAddress, proofCid));
    }

    async processVerification(requestId, status) {
        if (!this.verificationContract) return false;
        // status: 1 = Approved, 2 = Rejected
        return this._sendAdminTx(this.verificationAddress, this.verificationContract.methods.processVerification(requestId, status));
    }

    // ZK Proof Submission (Backend Proxy)
    // In a decentralized app, the user would call this directly.
    // Here, the backend can relay it if the user authenticates.
    async submitRangeProof(proofData, threshold) {
        if (!this.contract) return false;
        // proofData should have { pi_a, pi_b, pi_c } from snarkjs output
        
        try {
            // Note: Caller must be the user who owns the score for the proof to be valid (msg.sender checked in contract)
            // If Backend calls this, msg.sender is Admin. Admin proofs Admin's score.
            // If we want to prove User's score, the User MUST sign/send the tx.
            // However, this service is often used for Admin actions. 
            // If this is for testing Admin flow, it's fine.
            // If for User flow, this method should return the TX data for the frontend to sign.
            
            console.log(`[Web3] Submitting ZK Range Proof for threshold ${threshold}`);
            return this._sendAdminTx(this.registryAddress, this.contract.methods.submitRangeProof(
                proofData.pi_a,
                proofData.pi_b,
                proofData.pi_c,
                threshold
            ));
        } catch (error) {
            console.error("[Web3] Failed to submit proof:", error);
            return false;
        }
    }
    
    // Helper to generate proof payload for frontend users
    getProofTxData(proofData, threshold) {
        if (!this.contract) return null;
        return this.contract.methods.submitRangeProof(
            proofData.pi_a,
            proofData.pi_b,
            proofData.pi_c,
            threshold
        ).encodeABI();
    }

    async getVerificationRequests(address, role) {
        if (!this.verificationContract) {
            console.warn("[Web3] getVerificationRequests: contract not initialized");
            return [];
        }
        
        if (!address) {
            console.warn("[Web3] getVerificationRequests: missing address");
            return [];
        }

        const addr = address.toLowerCase();
        // Correct filter key based on role
        const filter = role === 'user' ? { user: addr } : { company: addr };
        
        console.log(`[Web3] Syncing Verification Events for ${role}: ${addr}`);
        try {
            const events = await this.verificationContract.getPastEvents('VerificationRequested', {
                filter,
                fromBlock: 0
            });

            const requests = await Promise.all(events.map(async (e) => {
                const id = e.returnValues.requestId;
                try {
                    // Fetch current status from contract state (source of truth for status)
                    const req = await this.verificationContract.methods.requests(id).call();
                    if (!req) return null;
                    
                    return {
                        id: id.toString(),
                        userAddress: req.user,
                        companyAddress: req.company,
                        proofCid: req.proofCid,
                        status: ['pending', 'approved', 'rejected'][Number(req.status)],
                        timestamp: Number(req.timestamp) * 1000
                    };
                } catch (err) {
                    console.warn(`[Web3] Failed to fetch request state for ID ${id}:`, err.message);
                    return null;
                }
            }));

            return requests.filter(r => r !== null).sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error(`[Web3] Error fetching history for ${addr}:`, error.message);
            return [];
        }
    }

    startEventListeners() {
        console.log('[Web3] Starting On-Chain Event Listeners...');
        const socketService = require('./socketService');

        if (this.contract) {
             console.log('[Web3] Available Events:', Object.keys(this.contract.events));
             
             this.contract.events.TransactionLogged()
             .on('data', (event) => {
                        try {
                        const data = {
                            type: 'tx',
                            from: event.returnValues.from,
                            to: event.returnValues.to,
                            amount: Number(event.returnValues.amount) / 100,
                            timestamp: Date.now(),
                            txHash: event.transactionHash
                        };
                        console.log(`[Web3Event] TX detected: ${data.from} -> ${data.to}`);
                        socketService.broadcast('tx_event', data);
                    } catch (error) {
                        console.error("Error subscribing to TransactionLogged:", error);
                    }
                    });

             try {
                this.contract.events.ReportSubmitted()
                    .on('data', (event) => {
                        const data = {
                            type: 'report',
                            reporter: event.returnValues.reporter,
                            target: event.returnValues.target,
                            reason: event.returnValues.reason,
                            timestamp: Date.now()
                        };
                        console.log(`[Web3Event] Report detected on ${data.target}`);
                        socketService.broadcast('report_event', data);
                    });
             } catch (error) {
                 console.error("Error subscribing to ReportSubmitted:", error);
             }

             try {
                this.contract.events.ScoreUpdated()
                    .on('data', (event) => {
                        const data = {
                            type: 'score',
                            user: event.returnValues.user,
                            newScore: Number(event.returnValues.newScore) / 100
                        };
                        console.log(`[Web3Event] Score update: ${data.user} -> ${data.newScore}`);
                        socketService.broadcast('score_event', data);
                    });
             } catch (error) {
                 console.error("Error subscribing to ScoreUpdated:", error);
             }
        }

        if (this.verificationContract) {
            try {
                this.verificationContract.events.VerificationRequested()
                    .on('data', (event) => {
                        const data = {
                            type: 'verification_req',
                            user: event.returnValues.user,
                            company: event.returnValues.company,
                            requestId: event.returnValues.requestId.toString()
                        };
                        console.log(`[Web3Event] Verification Req: ${data.user}`);
                        socketService.broadcast('verification_event', data);
                    });
            } catch (error) {
                console.error("Error subscribing to VerificationRequested:", error);
            }

            try {
                this.verificationContract.events.VerificationProcessed()
                    .on('data', (event) => {
                        const statusMap = ['pending', 'approved', 'rejected'];
                        const data = {
                            type: 'verification_res',
                            requestId: event.returnValues.requestId.toString(),
                            status: statusMap[Number(event.returnValues.status)],
                            reviewer: event.returnValues.reviewer
                        };
                        console.log(`[Web3Event] Verification Processed: ${data.status}`);
                        socketService.broadcast('verification_event', data);
                    });
            } catch (error) {
                console.error("Error subscribing to VerificationProcessed:", error);
            }
        }
    }
}

module.exports = new Web3Service();
