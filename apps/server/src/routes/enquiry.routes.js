const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { createB2BEnquiry, getB2BEnquiries, updateB2BEnquiry } = require('../controllers/remaining.controller');

router.post('/b2b', createB2BEnquiry);
router.get('/b2b', auth, roleGuard('admin', 'superadmin'), getB2BEnquiries);
router.put('/b2b/:id', auth, roleGuard('admin', 'superadmin'), updateB2BEnquiry);

module.exports = router;
