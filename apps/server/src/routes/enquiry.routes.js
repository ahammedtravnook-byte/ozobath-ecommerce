const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { createB2BEnquiry, getB2BEnquiries, updateB2BEnquiry } = require('../controllers/remaining.controller');

const { publicWriteLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const S = require('../schemas');

router.post('/b2b', publicWriteLimiter, validate(S.b2bEnquiry), createB2BEnquiry);
router.get('/b2b', auth, roleGuard('admin', 'superadmin'), getB2BEnquiries);
router.put('/b2b/:id', auth, roleGuard('admin', 'superadmin'), updateB2BEnquiry);

module.exports = router;
