const pinataSDK = require('@pinata/sdk');
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);

class IpfsService {
    async pinJson(data) {
        try {
            console.log('[SecureTransac] Pinning data to IPFS via Pinata...');
            // Check if keys are valid placeholders
            if (!process.env.PINATA_API_KEY || process.env.PINATA_API_KEY === 'your_pinata_api_key') {
                console.warn('[SecureTransac] Using Mock IPFS (Pinata keys not configured)');
                return { IpfsHash: `mock_cid_${Date.now()}` };
            }

            const options = {
                pinataMetadata: {
                    name: 'SecureTransac_Identity_Metadata',
                },
                pinataOptions: {
                    cidVersion: 0
                }
            };
            const result = await pinata.pinJSONToIPFS(data, options);
            console.log('[SecureTransac] IPFS Pinning successful:', result.IpfsHash);
            return result;
        } catch (error) {
            console.error('[SecureTransac] IPFS Pinning failed:', error);
            throw error;
        }
    }
}

module.exports = new IpfsService();
