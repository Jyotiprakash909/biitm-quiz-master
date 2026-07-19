const express = require('express');
const router = express.Router();
const { getAllSessions } = require('../controllers/sessionController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/', protectAdmin, getAllSessions);

module.exports = router;
