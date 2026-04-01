const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} = require('../controllers/adminNotification.controller');

const adminOnly = [auth, roleGuard('admin', 'superadmin')];

router.get('/', adminOnly, getAdminNotifications);
router.get('/unread-count', adminOnly, getAdminUnreadCount);
router.put('/mark-all-read', adminOnly, markAllAdminNotificationsRead);
router.put('/:id/read', adminOnly, markAdminNotificationRead);

module.exports = router;
