const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, clearAll } = require('../controllers/notificationController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/', protectAdmin, getNotifications);
router.put('/read-all', protectAdmin, markAllAsRead);
router.put('/:id/read', protectAdmin, markAsRead);
router.delete('/', protectAdmin, clearAll);

module.exports = router;
