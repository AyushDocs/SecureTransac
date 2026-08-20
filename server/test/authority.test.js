import { expect } from 'chai';
import supertest from 'supertest';
import express from 'express';

// Mock persistence and middleware for testing routes
import persistence from '../src/services/persistenceService.js';
import { updateAuthorityMetadata } from '../src/controllers/adminController.js';

const app = express();
app.use(express.json());

// Mock req.user for protect middleware
app.use((req, res, next) => {
    req.user = { address: '0x123', role: 'admin' };
    next();
});

app.patch('/api/admin/authorities/:address', updateAuthorityMetadata);

describe('Admin Controller - Authority Metadata', () => {
    beforeEach(() => {
        // Setup a mock authority
        persistence.saveAuthority('0x123', { name: 'Test Auth' });
    });

    it('should update authority metadata successfully', async () => {
        const response = await supertest(app)
            .patch('/api/admin/authorities/0x123')
            .send({ metadata: { publicKey: '0xabc' } });

        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
        expect(response.body.authority.publicKey).to.equal('0xabc');
    });

    it('should return 404 for non-existent authority', async () => {
        const response = await supertest(app)
            .patch('/api/admin/authorities/0x999')
            .send({ metadata: { publicKey: '0xabc' } });

        expect(response.status).to.equal(404);
    });
});
