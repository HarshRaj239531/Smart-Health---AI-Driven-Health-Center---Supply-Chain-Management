const express = require('express');
const router = express.Router();
const redistributionController = require('../controllers/redistribution.controller');
const { authenticate } = require('../middleware/auth');

router.get('/suggestions', authenticate, redistributionController.getSuggestions);
router.post('/approve', authenticate, redistributionController.approveSuggestion);
router.post('/reject', authenticate, redistributionController.rejectSuggestion);

module.exports = router;
