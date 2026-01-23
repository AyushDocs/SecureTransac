const aiService = require('../services/aiService');
const persistence = require('../services/persistenceService');
const web3Service = require('../services/web3Service');
const ipfsService = require('../services/ipfsService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secure-transac-super-secret-key-123';
const JWT_EXPIRES_IN = '7d';

const generateToken = (address, role) => {
    return jwt.sign({ address, role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
};

exports.getAnalytics = (req, res) => {
    console.log('[SecureTransac] Fetching global analytics');
    res.json(persistence.getAnalytics());
};

exports.evaluateAddress = async (req, res) => {
    const { address } = req.body;
    console.log(`[SecureTransac] Evaluating address: ${address}`);
    if (!address) return res.status(400).json({ error: 'Address required' });
    
    const result = await aiService.processEvaluation(address);
    res.json(result);
};

exports.getUserDetails = async (req, res) => {
    const { address } = req.params;
    console.log(`[SecureTransac] Fetching user details for: ${address}`);
    const data = persistence.getUser(address);
    
    try {
        const [onChainScore, identityCid, transactions, complaints] = await Promise.all([
            web3Service.getScore(address),
            web3Service.getIdentityCID(address),
            web3Service.getTransactionHistory(address),
            web3Service.getReports(address)
        ]);
        res.json({ 
            address, 
            ...data, 
            trustScore: onChainScore / 1000,
            identityCid: identityCid || data.identityCid,
            transactions,
            complaints
        });
    } catch (error) {
        console.error(`[SecureTransac] Failed to fetch on-chain data for ${address}:`, error);
        res.json({ address, ...data });
    }
};

exports.registerUser = (req, res) => {
    const { address, role, metadata } = req.body;
    console.log(`[SecureTransac] Registering user: ${address} as ${role}`);
    if (!address || !role) return res.status(400).json({ error: 'Address and Role required' });

    const user = persistence.register(address, role, metadata);
    res.json({ message: 'User registered successfully', user });
};

exports.processTransaction = async (req, res) => {
    const { from, to, amount } = req.body;
    console.log(`[SecureTransac] Processing transaction: ${from} -> ${to} (${amount})`);
    if (!from || !to || amount === undefined) return res.status(400).json({ error: 'Missing from, to, or amount' });

    const txId = await aiService.processTransaction(from, to, parseFloat(amount));
    res.json({ message: 'Transaction processed and scores updated', txId });
};

exports.processTransactionComment = async (req, res) => {
    const { from, target, txId, text, rating } = req.body;
    console.log(`[SecureTransac] Processing comment: ${from} on ${target} for ${txId}`);
    if (!from || !target || !txId || !text || rating === undefined) {
        return res.status(400).json({ error: 'Missing from, target, txId, text, or rating' });
    }

    await aiService.processTransactionComment(from, target, txId, text, parseInt(rating));
    res.json({ message: 'Comment processed and target score adjusted' });
};

exports.processReport = async (req, res) => {
    const { reporter, target, text } = req.body;
    console.log(`[SecureTransac] Processing report: ${reporter} reports ${target}`);
    if (!reporter || !target || !text) return res.status(400).json({ error: 'Missing reporter, target, or text' });

    await aiService.processReport(reporter, target, text);
    res.json({ message: 'Report analyzed and target score adjusted' });
};

exports.addEvent = (req, res) => {
    const { address, type, details } = req.body;
    console.log(`[SecureTransac] Recording event: ${type} for ${address}`);
    if (!address || !type) return res.status(400).json({ error: 'Missing fields' });

    const user = persistence.getUser(address);
    if (type === 'TRANSACTION') user.transactions.push(details);
    if (type === 'COMPLAINT') user.complaints.push(details);

    persistence.updateUser(address, user);
    res.json({ message: 'Event recorded', address });
};

exports.manualOverride = async (req, res) => {
    const { address, action, reason } = req.body;
    console.log(`[SecureTransac] Manual Override requested for ${address}: ${action}`);
    if (!address || !action || !reason) return res.status(400).json({ error: 'Missing address, action, or reason' });

    try {
        const result = await aiService.manualOverride(address, action, reason, req.body.targetScore);
        res.json(result);
    } catch (error) {
        console.error('[SecureTransac] Manual override failed:', error);
        res.status(500).json({ error: 'Manual override failed', message: error.message });
    }
};

exports.getAuditLogs = (req, res) => {
    console.log('[SecureTransac] Fetching audit logs');
    // For now, return a mock set of logs or aggregate from persistence
    const logs = [
        { id: '1', action: 'System Initialization', user: 'system', target: 'global', type: 'configuration', timestamp: new Date().toISOString() },
        { id: '2', action: 'API Online', user: 'system', target: 'health', type: 'configuration', timestamp: new Date().toISOString() }
    ];
    // In a real app, this would query a logs table/file
    res.json(logs);
};

// Authority Metadata Handlers
exports.getAuthorities = async (req, res) => {
    console.log('[SecureTransac] Fetching authorities and syncing with blockchain');
    const authorities = persistence.getAuthorities();
    const updatedAuthorities = {};

    for (const [address, data] of Object.entries(authorities)) {
        try {
            const onChainStatus = await web3Service.isReporter(address);
            // Sync local DB if on-chain status is the source of truth
            if (onChainStatus && data.status === 'revoked') {
                data.status = 'active';
                persistence.updateAuthority(address, { status: 'active' });
            } else if (!onChainStatus && data.status === 'active') {
                data.status = 'revoked';
                persistence.updateAuthority(address, { status: 'revoked' });
            }
            updatedAuthorities[address] = data;
        } catch (e) {
            updatedAuthorities[address] = data;
        }
    }
    res.json(updatedAuthorities);
};

exports.saveAuthority = (req, res) => {
    const { address, name, email, level } = req.body;
    console.log(`[SecureTransac] Saving authority metadata for ${address}`);
    if (!address || !name || !email) return res.status(400).json({ error: 'Missing address, name, or email' });
    
    persistence.saveAuthority(address, { name, email, level: level || 'security' });
    res.json({ message: 'Authority metadata saved', address });
};

exports.removeAuthority = (req, res) => {
    const { address } = req.params;
    console.log(`[SecureTransac] Removing authority metadata for ${address}`);
    if (!address) return res.status(400).json({ error: 'Address required' });

    persistence.removeAuthority(address);
    res.json({ message: 'Authority metadata removed', address });
};

exports.updateRiskHeatmap = (req, res) => {
    const { data } = req.body;
    console.log('[SecureTransac] Updating Risk Heatmap data');
    if (!data || !Array.isArray(data)) return res.status(400).json({ error: 'Heatmap data required' });
    
    persistence.updateRiskHeatmap(data);
    res.json({ message: 'Risk Heatmap updated' });
};

exports.updateEvaluationVelocity = (req, res) => {
    const { data } = req.body;
    console.log('[SecureTransac] Updating Evaluation Velocity data');
    if (!data || !Array.isArray(data)) return res.status(400).json({ error: 'Velocity data required' });
    
    persistence.updateEvaluationVelocity(data);
    res.json({ message: 'Evaluation Velocity updated' });
};

exports.getACL = (req, res) => {
    console.log('[SecureTransac] Fetching ACL entries');
    res.json(persistence.getACLEntries());
};

exports.getScoreUpdates = (req, res) => {
    console.log('[SecureTransac] Fetching recent score updates');
    res.json(persistence.getRecentScoreUpdates());
};

// Verification Request Handlers
exports.getVerificationRequests = async (req, res) => {
    const { companyAddress, userAddress } = req.query;
    try {
        if (userAddress) {
            const reqs = await web3Service.getVerificationRequests(userAddress, 'user');
            return res.json(reqs);
        }
        const reqs = await web3Service.getVerificationRequests(companyAddress, 'company');
        res.json(reqs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch on-chain verifications' });
    }
};

exports.requestVerification = async (req, res) => {
    const { userAddress, companyAddress, metadata } = req.body;
    console.log(`[SecureTransac] New on-chain verification request for: ${userAddress}`);
    if (!userAddress || !companyAddress) return res.status(400).json({ error: 'User and Company addresses required' });

    try {
        const proofCid = metadata?.proofCid || '';
        await web3Service.requestVerification(companyAddress, proofCid);
        res.json({ message: 'Verification request submitted on-chain' });
    } catch (error) {
        res.status(500).json({ error: 'On-chain submission failed' });
    }
};

exports.verifyUser = async (req, res) => {
    const { requestId, status, targetScore } = req.body;
    console.log(`[SecureTransac] Processing on-chain verification: ${requestId} (${status})`);
    
    try {
        // Map UI status to contract Status enum: Pending=0, Approved=1, Rejected=2
        const statusMap = { 'approved': 1, 'rejected': 2 };
        const contractStatus = statusMap[status.toLowerCase()] || 2;
        
        await web3Service.processVerification(requestId, contractStatus);

        if (status === 'approved') {
            const score = targetScore || 0.9;
            const requests = await web3Service.getVerificationRequests(req.user.address, 'company');
            const targetReq = requests.find(r => r.id == requestId);
            if (targetReq) {
                await web3Service.updateScore(targetReq.userAddress, score);
            }
        }

        res.json({ message: `Verification processed on-chain: ${status}` });
    } catch (error) {
        console.error('[SecureTransac] On-chain verification processing failed:', error);
        res.status(500).json({ error: 'On-chain verification processing failed' });
    }
};

// Cryptographic Auth Handlers
exports.getNonce = (req, res) => {
    const { address } = req.params;
    if (!address) return res.status(400).json({ error: 'Address required' });
    const nonce = persistence.getNonce(address);
    res.json({ nonce });
};

exports.verifySignature = async (req, res) => {
    const { address, signature } = req.body;
    if (!address || !signature) return res.status(400).json({ error: 'Address and Signature required' });

    try {
        const nonce = persistence.getNonce(address);
        // web3.eth.accounts.recover works with the message and signature
        const recoveredAddress = web3Service.web3.eth.accounts.recover(nonce, signature);

        if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
            // Success! Rotate nonce for next time
            persistence.rotateNonce(address);
            
            // Get user info to return
            const user = persistence.getUser(address);
            
            // Generate JWT
            const token = generateToken(address, user.role);
            
            res.json({ 
                success: true, 
                message: 'Authentication successful',
                user,
                token
            });
        } else {
            res.status(401).json({ success: false, error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('[SecureTransac] Auth verification error:', error);
        res.status(500).json({ error: 'Verification failed', message: error.message });
    }
};

exports.pinMetadata = async (req, res) => {
    const { metadata } = req.body;
    if (!metadata) return res.status(400).json({ error: 'Metadata required' });

    try {
        const result = await ipfsService.pinJson(metadata);
        res.json({ success: true, cid: result.IpfsHash });
    } catch (error) {
        console.error('[SecureTransac] IPFS Pinning failed:', error);
        res.status(500).json({ error: 'IPFS Pinning failed', message: error.message });
    }
};

exports.updateAuthorityMetadata = (req, res) => {
    const { address } = req.params;
    const { metadata } = req.body;
    
    if (!address || !metadata) return res.status(400).json({ error: 'Address and metadata required' });
    
    // Only the authority itself or admin can update
    if (req.user.address.toLowerCase() !== address.toLowerCase() && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this authority' });
    }

    const updated = persistence.updateAuthority(address, metadata);
    if (!updated) return res.status(404).json({ error: 'Authority not found' });

    res.json({ success: true, authority: updated });
};
