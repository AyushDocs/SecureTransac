const { Web3 } = require('web3');
const TrustRegistry = require('../../../onchain/build/contracts/TrustRegistry.json');
const IdentityVault = require('../../../onchain/build/contracts/IdentityVault.json');
const VerificationRegistry = require('../../../onchain/build/contracts/VerificationRegistry.json');
const cacheService = require('./cacheService');

// Force restart for new contracts

class Web3Service {
    constructor() {
        try {
            this.web3 = new Web3(process.env.PROVIDER_URL || 'http://127.0.0.1:7545');
            
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
        } catch (e) {
            console.error("[Web3] CRITICAL ERROR IN CONSTRUCTOR:", e);
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

        // Input score is 0-1 float, scale to 0-100 integer
        return this._sendAdminTx(this.registryAddress, this.contract.methods.updateScore(targetAddress, Math.floor(score * 100)));
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
            return 50;
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

    async getVerificationRequests(address, role) {
        if (!this.verificationContract) {
            console.warn("[Web3] getVerificationRequests: contract not initialized");
            return [];
        }
        
        const addr = address.toLowerCase();
        const filter = role === 'user' ? { user: addr } : { company: addr };
        
        console.log(`[Web3] Syncing Verification Events for ${role}: ${addr}`);
        const events = await this.verificationContract.getPastEvents('VerificationRequested', {
            filter,
            fromBlock: 0
        });

        const requests = await Promise.all(events.map(async (e) => {
            const id = e.returnValues.requestId;
            try {
                // Fetch current status from contract state (source of truth for status)
                const req = await this.verificationContract.methods.requests(id).call();
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
