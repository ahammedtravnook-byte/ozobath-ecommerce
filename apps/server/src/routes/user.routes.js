const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { getProfile, updateProfile } = require('../controllers/auth.controller');
const { getCustomerAnalytics } = require('../controllers/remaining.controller');

router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);
router.get('/', auth, roleGuard('admin', 'superadmin'), getCustomerAnalytics);

module.exports = router;
