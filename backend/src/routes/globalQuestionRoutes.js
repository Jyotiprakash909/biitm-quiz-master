const express = require('express');
const router = express.Router();
const {
  getGlobalQuestions
} = require('../controllers/questionController');
const { protectAdmin } = require('../middleware/authMiddleware');

// Global Question Bank Routes
router.route('/')
  .get(protectAdmin, getGlobalQuestions);

module.exports = router;
