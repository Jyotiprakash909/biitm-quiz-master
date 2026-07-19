const express = require('express');
const router = express.Router();
const {
  authAdmin,
  registerAdmin, // Only for initial setup or master admin to create others
  getDashboardStats
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/login', authAdmin);
router.post('/register', registerAdmin); // Enable for initial setup

router.route('/dashboard').get(protectAdmin, getDashboardStats);

module.exports = router;
