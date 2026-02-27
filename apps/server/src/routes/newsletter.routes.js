const router = require('express').Router();
const { subscribe, unsubscribe, getSubscribers } = require('../controllers/remaining.controller');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.get('/subscribers', auth, roleGuard('admin', 'superadmin'), getSubscribers);

module.exports = router;
