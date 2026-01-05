const { Web3 } = require('web3');
const TrustRegistry = require('../../../onchain/build/contracts/TrustRegistry.json');

class Web3Service {
    constructor() {
        this.web3 = new Web3(process.env.PROVIDER_URL || 'http://127.0.0.1:8545');
        this.registryAddress = process.env.REGISTRY_ADDRESS;
        this.adminAccount = process.env.ADMIN_PRIVATE_KEY 
            ? this.web3.eth.accounts.privateKeyToAccount(process.env.ADMIN_PRIVATE_KEY)
            : null;
            
        if (this.registryAddress) {
            this.contract = new this.web3.eth.Contract(TrustRegistry.abi, this.registryAddress);
        }
    }

    async updateScore(targetAddress, score) {
        if (!this.contract || !this.adminAccount) {
            console.log(`[Mock] Updating on-chain score for ${targetAddress} to ${score}`);
            return true;
        }

        const tx = this.contract.methods.updateScore(targetAddress, Math.floor(score * 1000));
        const gas = await tx.estimateGas({ from: this.adminAccount.address });
        const data = tx.encodeABI();
        
        const signedTx = await this.web3.eth.accounts.signTransaction({
            to: this.registryAddress,
            data,
            gas,
            gasPrice: await this.web3.eth.getGasPrice(),
        }, process.env.ADMIN_PRIVATE_KEY);

        return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    }

    async getScore(targetAddress) {
        if (!this.contract) return 500;
        return await this.contract.methods.getScore(targetAddress).call();
    }
}

module.exports = new Web3Service();
