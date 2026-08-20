import { expect } from 'chai';

describe('IpfsService', () => {
    it('should be disabled (and throw) when Pinata credentials are not configured', async () => {
        delete process.env.PINATA_API_KEY;
        delete process.env.PINATA_API_SECRET;
        delete process.env.PINATA_JWT;

        const mod = await import(`../src/services/ipfsService.js?reset=${Date.now()}`);
        const ipfsService = mod.default;
        expect(ipfsService.enabled).to.equal(false);

        try {
            await ipfsService.pinJSON({ test: 'data' });
            throw new Error('Should have thrown when IPFS is disabled');
        } catch (err) {
            expect(err.message).to.include('IPFS Service unavailable');
        }
    });
});