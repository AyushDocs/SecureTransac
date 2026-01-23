const { Web3 } = require('web3');
const TrustRegistry = require('../../../onchain/build/contracts/TrustRegistry.json');
const IdentityVault = require('../../../onchain/build/contracts/IdentityVault.json');
const VerificationRegistry = require('../../../onchain/build/contracts/VerificationRegistry.json');
const cacheService = require('./cacheService');

class Web3Service {
    constructor() {
        this.web3 = new Web3(process.env.PROVIDER_URL || 'http://127.0.0.1:8545');
        
        // Try to get addresses from env or build artifacts
        this.registryAddress = process.env.REGISTRY_ADDRESS;
        this.vaultAddress = process.env.VAULT_ADDRESS;
        this.verificationAddress = process.env.VERIFICATION_ADDRESS;
        
        const networks = Object.keys(TrustRegistry.networks);
        const latestNetwork = networks[networks.length - 1];

        if (!this.registryAddress) this.registryAddress = TrustRegistry.networks[latestNetwork]?.address;
        if (!this.vaultAddress) this.vaultAddress = IdentityVault.networks[latestNetwork]?.address;
        if (!this.verificationAddress) this.verificationAddress = VerificationRegistry.networks[latestNetwork]?.address;

        this.adminAccount = process.env.ADMIN_PRIVATE_KEY 
            ? this.web3.eth.accounts.privateKeyToAccount(process.env.ADMIN_PRIVATE_KEY)
            : null;
            
        if (this.registryAddress) {
            this.contract = new this.web3.eth.Contract(TrustRegistry.abi, this.registryAddress);
        }
        if (this.vaultAddress) {
            this.vaultContract = new this.web3.eth.Contract(IdentityVault.abi, this.vaultAddress);
        }
        if (this.verificationAddress) {
            this.verificationContract = new this.web3.eth.Contract(VerificationRegistry.abi, this.verificationAddress);
        }
    }

    async _sendAdminTx(contractAddress, methodCall) {
        if (!this.adminAccount) throw new Error("Admin account not configured");
        const gas = await methodCall.estimateGas({ from: this.adminAccount.address });
        const signedTx = await this.web3.eth.accounts.signTransaction({
            to: contractAddress,
            data: methodCall.encodeABI(),
            gas: Math.floor(gas * 1.2),
            gasPrice: await this.web3.eth.getGasPrice(),
        }, process.env.ADMIN_PRIVATE_KEY);
        return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    }

    async updateScore(targetAddress, score) {
        if (!this.contract) return false;
        return this._sendAdminTx(this.registryAddress, this.contract.methods.updateScore(targetAddress, Math.floor(score * 1000)));
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
            return await this.contract.methods.getScore(targetAddress).call();
        } catch (error) {
            return 500;
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

    async setReporterStatus(reporterAddress, status) {
        if (!this.contract) return false;
        return this._sendAdminTx(this.registryAddress, this.contract.methods.setReporterStatus(reporterAddress, status));
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
    async requestVerification(companyAddress, proofCid) {
        if (!this.verificationContract) return false;
        return this._sendAdminTx(this.verificationAddress, this.verificationContract.methods.requestVerification(companyAddress, proofCid));
    }

    async processVerification(requestId, status) {
        if (!this.verificationContract) return false;
        // status: 1 = Approved, 2 = Rejected
        return this._sendAdminTx(this.verificationAddress, this.verificationContract.methods.processVerification(requestId, status));
    }

    async getVerificationRequests(address, role) {
        if (!this.verificationContract) return [];
        
        const filter = role === 'user' ? { user: address } : { company: address };
        const events = await this.verificationContract.getPastEvents('VerificationRequested', {
            filter,
            fromBlock: 0
        });

        const requests = await Promise.all(events.map(async (e) => {
            const id = e.returnValues.requestId;
            // Fetch current status from contract state (source of truth for status)
            const req = await this.verificationContract.methods.requests(id).call();
            return {
                id,
                userAddress: req.user,
                companyAddress: req.company,
                proofCid: req.proofCid,
                status: ['pending', 'approved', 'rejected'][Number(req.status)],
                timestamp: Number(req.timestamp) * 1000
            };
        }));

        return requests.sort((a, b) => b.timestamp - a.timestamp);
    }

    startEventListeners() {
        console.log('[Web3] Starting On-Chain Event Listeners...');
        const socketService = require('./socketService');

        if (this.contract) {
            this.contract.events.TransactionLogged()
                .on('data', (event) => {
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
                })
                .on('error', console.error);

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
                })
                .on('error', console.error);

            this.contract.events.ScoreUpdated()
                .on('data', (event) => {
                    const data = {
                        type: 'score',
                        user: event.returnValues.user,
                        newScore: Number(event.returnValues.newScore) / 1000
                    };
                    console.log(`[Web3Event] Score update: ${data.user} -> ${data.newScore}`);
                    socketService.broadcast('score_event', data);
                })
                .on('error', console.error);
        }

        if (this.verificationContract) {
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
                })
                .on('error', console.error);

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
                })
                .on('error', console.error);
        }
    }
}

module.exports = new Web3Service();
