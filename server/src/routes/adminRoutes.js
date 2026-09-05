import express from 'express';
import adminController from '../controllers/adminController.js';
import { adminOnly, protect, restrictTo } from '../middleware/authMiddleware.js';
import rbacService from '../services/rbacService.js';

const router = express.Router();

// ============================================
// RBAC Routes - Multi-Dashboard Access
// ============================================

/**
 * @swagger
 * /api/admin/me:
 *   get:
 *     summary: Get current user info with all assigned roles
 *     tags: [Auth, RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info with roles array
 */
router.get('/me', protect, (req, res) => {
    const rbacData = rbacService.getUserRoles(req.user.address);
    
    res.json({
        walletAddress: req.user.address,
        roles: rbacData.roles,
        activeRole: rbacData.activeRole,
        // Backward compatibility
        role: rbacData.activeRole || req.user.role
    });
});

/**
 * @swagger
 * /api/admin/switch-role:
 *   post:
 *     summary: Switch active dashboard/role context
 *     tags: [Auth, RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin,viewer, deployer]
 *     responses:
 *       200:
 *         description: Role switched successfully
 *       403:
 *         description: User does not have the requested role
 */
router.post('/switch-role', protect, (req, res) => {
    const { role } = req.body;
    
    if (!role) {
        return res.status(400).json({ error: 'Role required' });
    }
    
    try {
        const result = rbacService.setActiveRole(req.user.address, role);
        res.json({
            success: true,
            message: `Switched to ${role} dashboard`,
            ...result
        });
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/admin/assign-roles:
 *   post:
 *     summary: Assign roles to a wallet address (admin only)
 *     tags: [Admin, RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletAddress:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Roles assigned successfully
 */
router.post('/assign-roles', protect, adminOnly, (req, res) => {
    const { walletAddress, roles } = req.body;
    
    if (!walletAddress || !roles) {
        return res.status(400).json({ error: 'walletAddress and roles array required' });
    }
    
    try {
        const result = rbacService.assignRoles(walletAddress, roles);
        res.json({
            success: true,
            message: 'Roles assigned successfully',
            ...result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/admin/user-roles/{address}:
 *   get:
 *     summary: Get roles for a specific wallet address
 *     tags: [Admin, RBAC]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User roles retrieved
 */
router.get('/user-roles/:address', (req, res) => {
    const rbacData = rbacService.getUserRoles(req.params.address);
    res.json(rbacData);
});

// ============================================
// Original Routes (Backward Compatible)
// ============================================
/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get global system analytics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Global analytics data
 */
// Public/System Config Routes
router.get('/contracts', adminController.getSystemContracts);
router.get('/network-stats', adminController.getNetworkStats);
router.get('/analytics', adminController.getAnalytics);

// System Controls
router.get('/system/status', protect, restrictTo('admin', 'deployer'), adminController.getSystemStatus);
router.post('/system/pause', protect, restrictTo('admin', 'deployer'), adminController.toggleSystemPause);
router.post('/system/gas', protect, restrictTo('admin', 'deployer'), adminController.updateGasConfig);
router.post('/system/upgrade', protect, restrictTo('admin', 'deployer'), adminController.upgradeSystem);

/**
 * @swagger
 * /api/admin/users/{address}:
 *   get:
 *     summary: Get comprehensive user details and scores
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: User wallet address
 *     responses:
 *       200:
 *         description: User details found
 *       404:
 *         description: User not found
 */
router.get('/users/:address', adminController.getUserDetails);

router.post('/register', adminController.registerUser);

/**
 * @swagger
 * /api/admin/evaluate:
 *   post:
 *     summary: Manually trigger address evaluation
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evaluation complete
 */
router.post('/evaluate', adminController.evaluateAddress);

router.post('/transaction', adminController.processTransaction);
router.post('/comment', adminController.processTransactionComment);
router.post('/report', protect, adminController.processReport);
router.post('/sbt/mint', protect, adminController.mintSBT);
router.get('/audit-logs', protect, restrictTo('admin', 'deployer'), adminController.getAuditLogs);
router.post('/manual-override', protect, restrictTo('admin', 'deployer'), adminController.manualOverride);
router.post('/events', protect, adminController.addEvent);

// Authority Metadata Management
router.get('/authorities', adminController.getAuthorities);
router.post('/authorities', protect, restrictTo('deployer'), adminController.saveAuthority);
router.patch('/authorities/:address', protect, adminController.updateAuthorityMetadata);
router.delete('/authorities/:address', protect, restrictTo('deployer'), adminController.removeAuthority);
router.post('/risk-heatmap', protect, restrictTo('admin'), adminController.updateRiskHeatmap);
router.post('/evaluation-velocity', protect, restrictTo('admin'), adminController.updateEvaluationVelocity);
router.get('/acl', adminController.getACL);
router.get('/score-updates', adminController.getScoreUpdates);
router.get('/verifications', protect, adminController.getVerificationRequests);
router.post('/request-verification', protect, adminController.requestVerification);
router.post('/verify-user', protect, restrictTo('company', 'admin'), adminController.verifyUser);
router.get('/auth/nonce/:address', adminController.getNonce);
router.post('/auth/verify', adminController.verifySignature);
router.post('/ipfs/pin', adminController.pinMetadata); // No auth for registration flow
router.get('/score/:address', adminController.getScoreAdmin);

// Privacy & Homomorphic Encryption (Enhanced Privacy)
router.get('/privacy/key', adminController.getPrivacyPublicKey);
router.post('/privacy/aggregate', adminController.aggregateEncryptedImpacts);
router.post('/privacy/decrypt', protect, restrictTo('admin'), adminController.decryptImpact);

// Advanced Analytics
router.get('/analytics/fingerprint/:address', adminController.getFingerprint);
router.get('/analytics/heatmap', adminController.getGlobalHeatmap);
router.get('/analytics/sybil', protect, restrictTo('admin'), adminController.getSybilClusters);
router.get('/analytics/warroom', adminController.getWarRoom);

// Cross-Chain Bridge
router.post('/bridge/sync', protect, restrictTo('admin'), adminController.syncCrossChainScore);
router.post('/proof', protect, adminController.generateProof);
router.post('/verify-proof', adminController.verifyProof); // Public verification tool
router.post('/stealth', protect, adminController.generateStealthAddress);
router.get('/reports/user/:address', protect, adminController.getUserReport);
router.get('/blind/keys', adminController.getBlindKeys);
router.post('/blind/sign', protect, adminController.signBlind);
router.post('/blind/submit', adminController.submitAnonymousReport);

router.get('/appeals', protect, adminController.getAppeals);
router.post('/appeals', protect, adminController.submitAppeal);
router.post('/appeals/process', protect, restrictTo('admin', 'deployer'), adminController.processAppeal);

export default router;
