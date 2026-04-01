const router = require('express').Router();
const auth = require('../middleware/auth');
const { getNotifications, getUnreadCount, markAsRead, markAllRead, deleteNotification } = require('../controllers/notification.controller');

router.get('/', auth, getNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.put('/mark-all-read', auth, markAllRead);
router.put('/:id/read', auth, markAsRead);
router.delete('/:id', auth, deleteNotification);

module.exports = router;
