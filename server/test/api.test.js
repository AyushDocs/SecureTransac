const request = require('supertest');
const { expect } = require('chai');
const { app, server } = require('../index');

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

    it('should process a transaction and update scores', async () => {
        const res = await request(app)
            .post('/api/admin/transaction')
            .send({ from: userA, to: userB, amount: 50 });
        
        expect(res.status).to.equal(200);
        
        const details = await request(app).get(`/api/admin/users/${userA}`);
        expect(details.body.transactions.length).to.be.at.least(1);
    });

    it('should penalize user for interacting with bad actors', async () => {
        // First, mark attacker as bad via report
        await request(app)
            .post('/api/admin/report')
            .send({ reporter: userA, target: attacker, text: 'This is a total SCAM fraud theft!' });

        // User B interacts with attacker
        const res = await request(app)
            .post('/api/admin/transaction')
            .send({ from: userB, to: attacker, amount: 10 });

        expect(res.status).to.equal(200);
        
        const userBDetails = await request(app).get(`/api/admin/users/${userB}`);
        // Score should drop from default 0.5 due to penalty + history interaction
        expect(userBDetails.body.trustScore).to.be.below(0.5);
    });

    it('should fetch global analytics', async () => {
        const res = await request(app).get('/api/admin/analytics');
        expect(res.status).to.equal(200);
        expect(res.body.totalEvaluations).to.be.at.least(1);
    });
});
