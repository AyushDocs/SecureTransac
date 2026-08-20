import request from 'supertest';
import { expect } from 'chai';
import { app, server } from '../index.js';

describe('SecureTransac API', () => { 
    after(() => {
        server.close();
    });
    const userA = '0x1111111111111111111111111111111111111111';
    const userB = '0x2222222222222222222222222222222222222222';
    const attacker = '0xBAD6666666666666666666666666666666666666';

    it('should return health check', async () => {
        const res = await request(app).get('/health');
        expect(res.status).to.equal(200);
    });

    it('should register a user', async () => {
        const res = await request(app)
            .post('/api/admin/register')
            .send({ address: userA, role: 'user', metadata: { name: 'Test User' } });
        expect(res.status).to.equal(200);
        expect(res.body.message).to.include('registered');
    });

    it('should process a transaction', async () => {
        const res = await request(app)
            .post('/api/admin/transaction')
            .send({ from: userA, to: userB, amount: 50 });
        expect(res.status).to.equal(200);
        expect(res.body.message).to.include('processed');
    });

    it('should return user details with a default trust score', async () => {
        const res = await request(app).get(`/api/admin/users/${userA}`);
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('address');
    });

    it('should require authentication to submit a report', async () => {
        const res = await request(app)
            .post('/api/admin/report')
            .send({ reporter: userA, target: attacker, text: 'This is a total SCAM fraud theft!' });
        // The report endpoint is auth-protected
        expect(res.status).to.equal(401);
    });

    it('should fetch global analytics', async () => {
        const res = await request(app).get('/api/admin/analytics');
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('totalEvaluations');
    });
});
