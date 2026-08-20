import { expect } from 'chai';
import { generateRandomKeys } from 'paillier-bigint';

// Mock dependencies if needed, or interpret integration test
// Since web3Service uses actual Paillier library, we can test encryption/decryption flow logic 
// without needing a real blockchain if we mock the connection.

describe('ZK Privacy Service Tests', () => {

    it('should encrypt and decrypt a score correctly using Paillier', async () => {
        // 1. Generate keys 
        // Note: web3Service generates keys lazily but they are stored in `this.paillierKeys`.
        // We will manually invoke key generation for the test context or use the service if exposed.
        
        // Simulating the logic inside web3Service
        const keys = await generateRandomKeys(512); // Use 512 for speed in test
        const pub = keys.publicKey;
        const priv = keys.privateKey;

        const originalScore = 80;
        const normalized = BigInt(originalScore * 100);

        // 2. Encrypt
        const encrypted = pub.encrypt(normalized);
        expect(encrypted).to.be.a('bigint');

        // 3. Decrypt
        const decrypted = priv.decrypt(encrypted);
        const recoveredScore = Number(decrypted) / 100;

        expect(recoveredScore).to.equal(originalScore);
    });

    it('should generate valid Paillier ciphertext compatible with on-chain storage format (hex)', async () => {
        const keys = await generateRandomKeys(512);
        const m = BigInt(75 * 100);
        const c = keys.publicKey.encrypt(m);

        // Format used in web3Service
        let encryptedHex = c.toString(16);
        if (encryptedHex.length % 2) encryptedHex = '0' + encryptedHex;
        const storageValue = '0x' + encryptedHex;

        expect(storageValue).to.match(/^0x[0-9a-fA-F]+$/);

        // Validating reverse
        const hexPayload = storageValue.substring(2);
        const recoveredBigInt = BigInt('0x' + hexPayload);
        const decrypted = keys.privateKey.decrypt(recoveredBigInt);
        
        expect(Number(decrypted) / 100).to.equal(75);
    });
});