import fs from 'fs';

const UPLOAD_URL = 'https://uploads.pinata.cloud/v3/files';
const MAX_ATTEMPTS = 3;

class IpfsService {
    constructor() {
        this.jwt = process.env.PINATA_JWT;
        this.enabled = Boolean(this.jwt);

        if (!this.enabled) {
            console.warn('[IPFS] PINATA_JWT missing. IPFS upload disabled.');
        }
    }

    async _upload(formData) {
        let attempts = 0;

        while (attempts < MAX_ATTEMPTS) {
            try {
                const response = await fetch(UPLOAD_URL, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${this.jwt}` },
                    body: formData,
                });
                const json = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const reason = json?.error?.reason || json?.error?.message || json?.message || `HTTP ${response.status}`;
                    throw new Error(`Pinata upload failed: ${reason}`);
                }
                return json.data;
            } catch (error) {
                attempts++;
                console.warn(`[IPFS] Pinning attempt ${attempts} failed:`, error.message);
                if (attempts === MAX_ATTEMPTS) throw error;
                await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            }
        }
    }

    async pinFile(filePath, options = {}) {
        if (!this.enabled) throw new Error("IPFS Service unavailable");

        const meta = options.pinataMetadata || {};
        const formData = new FormData();
        formData.append('file', new Blob([fs.readFileSync(filePath)], { type: 'application/octet-stream' }));
        formData.append('network', options.network || 'public');
        if (meta.name) formData.append('name', meta.name);
        if (meta.keyvalues) formData.append('keyvalues', JSON.stringify(meta.keyvalues));
        if (options.cid_version) formData.append('cid_version', options.cid_version);

        const data = await this._upload(formData);
        return { IpfsHash: data.cid, pinSize: data.size, ...data };
    }

    async pinJSON(body, options = {}) {
        if (!this.enabled) throw new Error("IPFS Service unavailable");

        const meta = options.pinataMetadata || {};
        const formData = new FormData();
        formData.append('file', new Blob([JSON.stringify(body)], { type: 'application/json' }));
        formData.append('network', options.network || 'public');
        if (meta.name) formData.append('name', meta.name);
        if (meta.keyvalues) formData.append('keyvalues', JSON.stringify(meta.keyvalues));
        if (options.cid_version) formData.append('cid_version', options.cid_version);

        const data = await this._upload(formData);
        return { IpfsHash: data.cid, pinSize: data.size, ...data };
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
