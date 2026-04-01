const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { getActivityLogs } = require('../controllers/activityLog.controller');

router.get('/', auth, roleGuard('admin', 'superadmin'), getActivityLogs);

module.exports = router;
