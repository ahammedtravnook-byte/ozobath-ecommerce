const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, toggleAdminStatus } = require('../controllers/remaining.controller');

router.get('/users', auth, roleGuard('superadmin'), getAdminUsers);
router.post('/users', auth, roleGuard('superadmin'), createAdminUser);
router.put('/users/:id', auth, roleGuard('superadmin'), updateAdminUser);
router.delete('/users/:id', auth, roleGuard('superadmin'), deleteAdminUser);
router.put('/users/:id/toggle-status', auth, roleGuard('superadmin'), toggleAdminStatus);

module.exports = router;
