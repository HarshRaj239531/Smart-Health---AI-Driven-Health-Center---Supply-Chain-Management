const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, attendanceController.getAttendance);
router.post('/simulate', authenticate, attendanceController.clockInSimulator);

module.exports = router;
