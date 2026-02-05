import pinataSDK from '@pinata/sdk';
import fs from 'fs';

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

    async fetchJSON(cid) {
        try {
            const gateways = [
                `https://gateway.pinata.cloud/ipfs/${cid}`,
                `https://ipfs.io/ipfs/${cid}`,
                `https://dweb.link/ipfs/${cid}`
            ];

            for (const url of gateways) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        return await response.json();
                    }
                } catch (e) {
                    continue;
                }
            }
            throw new Error(`Failed to fetch CID ${cid} from all gateways`);
        } catch (error) {
            console.error(`[IPFS] Fetch failed for ${cid}:`, error.message);
            return null;
        }
    }
}

export default new IpfsService();
