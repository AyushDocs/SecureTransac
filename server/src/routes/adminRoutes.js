const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/analytics', adminController.getAnalytics);
router.get('/users/:address', adminController.getUserDetails);
router.post('/evaluate', adminController.evaluateAddress);
router.post('/transaction', adminController.processTransaction);
router.post('/report', adminController.processReport);
router.get('/audit-logs', adminController.getAuditLogs);
router.post('/manual-override', adminController.manualOverride);
router.post('/events', adminController.addEvent);

// Authority Metadata Management
router.get('/authorities', adminController.getAuthorities);
router.post('/authorities', adminController.saveAuthority);
router.delete('/authorities/:address', adminController.removeAuthority);
router.post('/risk-heatmap', adminController.updateRiskHeatmap);
router.post('/evaluation-velocity', adminController.updateEvaluationVelocity);
router.get('/acl', adminController.getACL);
router.get('/score-updates', adminController.getScoreUpdates);

module.exports = router;
