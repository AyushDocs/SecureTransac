import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Web3 } from 'web3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const trustRegistryPath = path.join(__dirname, '../../../onchain/build/contracts/TrustRegistry.json');
let TrustRegistry;
try {
    TrustRegistry = JSON.parse(fs.readFileSync(trustRegistryPath, 'utf8'));
} catch (e) {
    console.error("[Bridge] Failed to load TrustRegistry.json:", e.message);
    TrustRegistry = { abi: [] }; // Fallback
}

/**
 * BridgeService handles cross-chain reputation syncing.
 * Simulates a relayer that fetches scores from a source chain (e.g. Sepolia)
 * and verifies/pushed them to a destination chain (e.g. Polygon Amoy).
 */
class BridgeService {
    constructor() {
        this.networks = {
            '11155111': process.env.SEPOLIA_RPC || 'https://rpc.sepolia.org',
            '80002': process.env.AMOY_RPC || 'https://rpc-amoy.polygon.technology',
            '1337': process.env.LOCALHOST_RPC || 'http://127.0.0.1:7545'
        };
        
        this.instances = {};
        this.adminKey = process.env.ADMIN_PRIVATE_KEY;
    }

    _getWeb3(chainId) {
        if (this.instances[chainId]) return this.instances[chainId];
        
        const rpc = this.networks[chainId];
        if (!rpc) throw new Error(`Unsupported Chain ID for Bridge: ${chainId}`);
        
        const web3 = new Web3(rpc);
        this.instances[chainId] = web3;
        return web3;
    }

    async getScoreFromChain(chainId, contractAddress, userAddress) {
        const web3 = this._getWeb3(chainId);
        const contract = new web3.eth.Contract(TrustRegistry.abi, contractAddress);
        
        // Use a generic caller or admin account if available
        const score = await contract.methods.getScore(userAddress).call({
             from: process.env.ADMIN_ADDRESS || '0x0000000000000000000000000000000000000000' 
        });
        
        return Number(score);
    }

    async syncScoreToChain(targetChainId, targetContractAddress, userAddress, scoreToSync) {
        if (!this.adminKey) throw new Error("Bridge Relayer: ADMIN_PRIVATE_KEY not set");

        const web3 = this._getWeb3(targetChainId);
        const contract = new web3.eth.Contract(TrustRegistry.abi, targetContractAddress);
        const adminAccount = web3.eth.accounts.privateKeyToAccount(this.adminKey);

        console.log(`[Bridge] Syncing score ${scoreToSync} for ${userAddress} to Chain ${targetChainId}...`);

        const methodCall = contract.methods.updateScore(userAddress, scoreToSync);
        const gas = await methodCall.estimateGas({ from: adminAccount.address });
        
        const signedTx = await web3.eth.accounts.signTransaction({
            to: targetContractAddress,
            data: methodCall.encodeABI(),
            gas: Math.floor(gas * 1.5),
            gasPrice: await web3.eth.getGasPrice(),
        }, this.adminKey);

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log(`[Bridge] Sync complete. Tx: ${receipt.transactionHash}`);
        
        return {
            success: true,
            txHash: receipt.transactionHash,
            score: scoreToSync
        };
    }
}

export default new BridgeService();
