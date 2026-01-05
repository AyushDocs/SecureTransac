const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/analytics', adminController.getAnalytics);
router.get('/users/:address', adminController.getUserDetails);
router.post('/evaluate', adminController.evaluateAddress);
router.post('/transaction', adminController.processTransaction);
router.post('/report', adminController.processReport);
router.post('/events', adminController.addEvent);

module.exports = router;
