const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');

router.get('/overview', authenticate, analyticsController.getDashboardOverview);
router.get('/beds', authenticate, analyticsController.getBedsStatus);
router.post('/beds/update', authenticate, analyticsController.updateBedsStatus);
router.get('/tests', authenticate, analyticsController.getTestAudits);
router.post('/tests/update', authenticate, analyticsController.updateTestAudit);

module.exports = router;
