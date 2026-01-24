const aiService = require('../services/aiService');
const persistence = require('../services/persistenceService');
const web3Service = require('../services/web3Service');
const ipfsService = require('../services/ipfsService');
const privacyService = require('../services/privacyService');
const analyticsService = require('../services/analyticsService');
const bridgeService = require('../services/bridgeService');
const rbacService = require('../services/rbacService');
const socketService = require('../services/socketService');
const jwt = require('jsonwebtoken');

// Initialize privacy keys on startup
privacyService.initialize().catch(err => console.error('[Privacy] Init failed:', err));

const JWT_SECRET = process.env.JWT_SECRET || 'secure-transac-super-secret-key-123';
const JWT_EXPIRES_IN = '7d';

const generateToken = (address, role, roles = [], activeRole = null) => {
    return jwt.sign({ 
        address, 
        role,  // Keep for backward compatibility
        roles: roles.length > 0 ? roles : [role],
        activeRole: activeRole || role
    }, JWT_SECRET, {
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
            trustScore: Number(onChainScore) / 1000,
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
    res.json(Object.values(updatedAuthorities));
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
        console.error('[SecureTransac] Error fetching verifications:', error);
        res.status(500).json({ error: 'Failed to fetch on-chain verifications' });
    }
};

exports.requestVerification = async (req, res) => {
    const { userAddress, companyAddress, metadata } = req.body;
    console.log(`[SecureTransac] New on-chain verification request for: ${userAddress}`);
    if (!userAddress || !companyAddress) return res.status(400).json({ error: 'User and Company addresses required' });

    try {
        const proofCid = metadata?.proofCid || '';
        await web3Service.requestVerification(userAddress, companyAddress, proofCid);
        res.json({ message: 'Verification request submitted on-chain' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getFingerprint = async (req, res) => {
    const { address } = req.params;
    try {
        const fingerprint = await analyticsService.calculateFingerprint(address);
        res.json(fingerprint);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getGlobalHeatmap = async (req, res) => {
    try {
        const heatmap = await analyticsService.getRiskHeatmapData();
        res.json({ heatmap });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSybilClusters = async (req, res) => {
    try {
        const clusters = await analyticsService.detectSybilClusters();
        res.json({ clusters });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
            
            // Get user info and RBAC data
            const user = persistence.getUser(address);
            
            // Get or migrate RBAC roles
            let rbacData = rbacService.getUserRoles(address);
            
            // If user has a legacy role but not in RBAC, migrate them
            if (user.role && rbacData.roles.length <= 1) {
                rbacData = rbacService.migrateLegacyUser(address, user.role);
            }
            
            // Generate JWT with RBAC support
            const token = generateToken(
                address, 
                rbacData.activeRole || user.role,
                rbacData.roles,
                rbacData.activeRole
            );
            
            res.json({ 
                success: true, 
                message: 'Authentication successful',
                user: {
                    ...user,
                    roles: rbacData.roles,
                    activeRole: rbacData.activeRole
                },
                roles: rbacData.roles,
                activeRole: rbacData.activeRole,
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
        const result = await ipfsService.pinJSON(metadata);
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

exports.getScoreAdmin = async (req, res) => {
    let { address } = req.params;
    
    // Check if this is a stealth address and resolve to true identity
    const resolvedIdentity = persistence.resolveAddress(address);
    if (resolvedIdentity) {
        console.log(`[Score] Redirecting Stealth Address ${address} -> Main Identity ${resolvedIdentity}`);
        address = resolvedIdentity;
    }

    console.log(`[Admin] Fetching score for: ${address}`);
    
    try {
        // Admin uses getScore which is free (owner-only on contract)
        const score = await web3Service.getScore(address);
        res.json({ score: Number(score) });
    } catch (error) {
        console.error('[Admin] Failed to fetch score:', error);
        res.status(500).json({ error: 'Failed to fetch score' });
    }
};

// Privacy & Homomorphic Encryption (Enhanced Privacy)
exports.getPrivacyPublicKey = (req, res) => {
    const key = privacyService.getPublicKey();
    if (!key) return res.status(503).json({ error: 'Privacy service warming up' });
    res.json(key);
};

exports.aggregateEncryptedImpacts = (req, res) => {
    const { ciphertexts } = req.body;
    if (!Array.isArray(ciphertexts)) return res.status(400).json({ error: 'Ciphertexts array required' });
    
    try {
        const result = privacyService.aggregate(ciphertexts);
        res.json({ aggregatedCiphertext: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.decryptImpact = (req, res) => {
    const { ciphertext } = req.body;
    try {
        const result = privacyService.decrypt(ciphertext);
        res.json({ decryptedValue: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Advanced Analytics
exports.getFingerprint = async (req, res) => {
    const { address } = req.params;
    try {
        const fingerprint = await analyticsService.calculateFingerprint(address);
        res.json(fingerprint);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getGlobalHeatmap = async (req, res) => {
    try {
        const heatmap = await analyticsService.getRiskHeatmapData();
        res.json({ heatmap });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSybilClusters = async (req, res) => {
    try {
        const clusters = await analyticsService.detectSybilClusters();
        res.json({ clusters });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.syncCrossChainScore = async (req, res) => {
    const { userAddress, sourceChainId, sourceContract, targetChainId, targetContract } = req.body;
    
    if (!userAddress || !sourceChainId || !targetChainId) {
        return res.status(400).json({ error: 'Missing sync parameters' });
    }

    try {
        // Step 1: Fetch from source
        const score = await bridgeService.getScoreFromChain(sourceChainId, sourceContract, userAddress);
        
        // Step 2: Push to target
        const result = await bridgeService.syncScoreToChain(targetChainId, targetContract, userAddress, score);
        
        res.json({
            message: 'Cross-chain sync successful',
            score,
            ...result
        });
    } catch (error) {
        console.error('[Bridge] Sync failed:', error);
        res.status(500).json({ error: error.message });
    }
};


const zkProofService = require('../services/zkProofService');

exports.generateProof = async (req, res) => {
    const { address, threshold, secret } = req.body;
    
    // Authorization check
    if (req.user && req.user.role !== 'admin' && req.user.address.toLowerCase() !== address.toLowerCase()) {
         return res.status(403).json({ error: 'Not authorized for this address' });
    }

    if (!address || !threshold || !secret) {
        return res.status(400).json({ error: 'Address, threshold, and secret required' });
    }

    try {
        const score = await web3Service.getScore(address);
        // Ensure inputs are numbers/strings as expected
        const proofData = await zkProofService.generateScoreProof(score, threshold, secret);
        res.json({ success: true, ...proofData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const stealthService = require('../services/stealthService');
exports.generateStealthAddress = (req, res) => {
    try {
        const result = stealthService.generateStealthMeta(null);
        // Link the generated stealth address to the requesting user
        if (req.user && req.user.address) {
            persistence.linkStealthAddress(result.stealthAddress, req.user.address);
        }
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserReport = (req, res) => {
    const userId = req.params.address || req.user.address; 
    
    // Security check
    if (req.user.role !== 'admin' && req.user.address.toLowerCase() !== userId.toLowerCase()) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = persistence.getUser(userId);
    const history = user.scoreHistory || [];
    
    const statement = history.map(entry => ({
        date: entry.timestamp ? new Date(entry.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        event: entry.reason || 'Trust Score Update',
        status: 'Verified'
    }));

    if (statement.length === 0) {
        statement.push({
            date: new Date(user.registrationDate || Date.now()).toISOString().split('T')[0],
            event: 'System Registration',
            status: 'Active'
        });
    }

    res.json({ statement });
};

const blindService = require('../services/blindSignatureService');

exports.getBlindKeys = (req, res) => {
    res.json(blindService.getPublicKeys());
};

exports.signBlind = (req, res) => {
    const { blinded } = req.body;
    if (!blinded) return res.status(400).json({ error: 'Blinded message required' });
    try {
        const signature = blindService.signBlindedMessage(blinded);
        res.json({ signature });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.submitAnonymousReport = async (req, res) => {
    const { targetAddress, intent, hash, signature } = req.body;
    
    if (!targetAddress || !intent || !hash || !signature) {
        return res.status(400).json({ error: 'Missing required report fields' });
    }

    try {
        // 1. Verify the Blind Signature (Unblinded)
        // This proves the reporter was authenticated when gettting the signature,
        // but because it's unblinded, the server can't link it to the request session.
        const isValid = blindService.verifySignature(hash, signature);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid anonymous signature' });
        }

        console.log(`[BlindReport] Verified Protocol-Signature. Processing AI Intent for target ${targetAddress}`);

        // 2. Use AI to analyze intent and generate score decrease
        // aiService.processReport handles the logic: intent -> flags -> weight -> score decrease
        await aiService.processReport('ANONYMOUS', targetAddress, intent);

        res.json({ 
            success: true, 
            message: 'Anonymous report analyzed by AI and submitted successfully.',
            target: targetAddress,
            status: 'Score adjusted'
        });
    } catch (error) {
        console.error('[BlindReport] Submission failed:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.submitAppeal = async (req, res) => {
    const { reason, currentScore, metadata } = req.body;
    const userAddress = req.user.address;

    if (!reason || currentScore === undefined) {
        return res.status(400).json({ error: 'Reason and Current Score required' });
    }

    try {
        const appeal = persistence.createAppeal(userAddress, reason, currentScore, metadata);
        
        // Notify admins via socket
        socketService.broadcast('appeal_event', { 
            type: 'appeal_requested', 
            user: userAddress,
            id: appeal.id 
        });

        res.status(201).json(appeal);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAppeals = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin' || req.user.role === 'deployer';
        const appeals = persistence.getAppeals(isAdmin ? null : req.user.address);
        res.json(appeals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.processAppeal = async (req, res) => {
    const { appealId, status, comment, adjustmentScore } = req.body;
    const reviewerAddress = req.user.address;

    if (!appealId || !status) {
        return res.status(400).json({ error: 'AppealId and Status required' });
    }

    try {
        const result = persistence.updateAppealStatus(appealId, status, reviewerAddress, comment);
        if (!result) return res.status(404).json({ error: 'Appeal not found' });

        // If approved and adjustmentScore provided, push to blockchain
        if (status === 'approved' && adjustmentScore !== undefined) {
            console.log(`[Appeals] Approving appeal for ${result.userAddress}. Pushing score ${adjustmentScore}`);
            await web3Service.updateScore(result.userAddress, adjustmentScore);
        }

        socketService.broadcast('appeal_event', { 
            type: 'appeal_processed', 
            id: appealId, 
            status,
            user: result.userAddress
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
