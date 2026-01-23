const chai = require('chai');
const expect = chai.expect;
const supertest = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Mock persistence and middleware for testing routes
const persistence = require('../src/services/persistenceService');
const adminController = require('../src/controllers/adminController');

const app = express();
app.use(bodyParser.json());

// Mock req.user for protect middleware
app.use((req, res, next) => {
    req.user = { address: '0x123', role: 'admin' };
    next();
});

app.patch('/api/admin/authorities/:address', adminController.updateAuthorityMetadata);

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
