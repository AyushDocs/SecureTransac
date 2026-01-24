const pinataSDK = require('@pinata/sdk');
const fs = require('fs');

class IpfsService {
    constructor() {
        const apiKey = process.env.PINATA_API_KEY;
        const apiSecret = process.env.PINATA_API_SECRET;

        if (apiKey && apiSecret) {
            this.pinata = new pinataSDK(apiKey, apiSecret);
            this.enabled = true;
            // Test auth silently
            this.pinata.testAuthentication().catch(err => {
                console.error("[IPFS] Pinata Auth Failed:", err.message);
                this.enabled = false;
            });
        } else {
            console.warn("[IPFS] PINATA_API_KEY or SECRET missing. IPFS upload disabled.");
            this.enabled = false;
        }
    }

    async pinFile(filePath, options = {}) {
        if (!this.enabled) throw new Error("IPFS Service unavailable");
        
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                const stream = fs.createReadStream(filePath);
                return await this.pinata.pinFileToIPFS(stream, options);
            } catch (error) {
                attempts++;
                console.warn(`[IPFS] File pinning attempt ${attempts} failed:`, error.message);
                if (attempts === maxAttempts) throw error;
                await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            }
        }
    }

    async pinJSON(body, options = {}) {
        if (!this.enabled) throw new Error("IPFS Service unavailable");
        
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                return await this.pinata.pinJSONToIPFS(body, options);
            } catch (error) {
                attempts++;
                console.warn(`[IPFS] Pinning attempt ${attempts} failed:`, error.message);
                if (attempts === maxAttempts) throw error;
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            }
        }
    }
}

module.exports = new IpfsService();
