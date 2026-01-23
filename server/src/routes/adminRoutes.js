const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/analytics', adminController.getAnalytics);
router.get('/users/:address', adminController.getUserDetails);
router.post('/register', adminController.registerUser);
router.post('/evaluate', adminController.evaluateAddress);
router.post('/transaction', adminController.processTransaction);
router.post('/comment', adminController.processTransactionComment);
router.post('/report', protect, adminController.processReport);
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
router.post('/ipfs/pin', protect, adminController.pinMetadata);

module.exports = router;
