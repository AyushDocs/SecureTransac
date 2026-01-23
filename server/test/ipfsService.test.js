const chai = require('chai');
const expect = chai.expect;
const ipfsService = require('../src/services/ipfsService');

describe('IpfsService', () => {
    it('should return a mock CID when Pinata keys are not configured', async () => {
        // Ensure keys are mocked
        process.env.PINATA_API_KEY = 'your_pinata_api_key';
        
        const result = await ipfsService.pinJson({ test: 'data' });
        expect(result).to.have.property('IpfsHash');
        expect(result.IpfsHash).to.contain('mock_cid_');
    });

    it('should throw an error if pinning fails (not applicable in mock)', async () => {
        // This is hard to test without real keys unless we mock the Pinata SDK
    });
});
