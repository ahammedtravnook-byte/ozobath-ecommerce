const router = require('express').Router();
const { subscribe, unsubscribe, getSubscribers } = require('../controllers/remaining.controller');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { publicWriteLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const S = require('../schemas');

router.post('/subscribe', publicWriteLimiter, validate(S.newsletterSubscribe), subscribe);
router.post('/unsubscribe', publicWriteLimiter, unsubscribe);
router.get('/subscribers', auth, roleGuard('admin', 'superadmin'), getSubscribers);

module.exports = router;
