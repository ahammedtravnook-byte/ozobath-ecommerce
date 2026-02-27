const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { getDashboard, getSalesReport, getCustomerAnalytics } = require('../controllers/remaining.controller');

router.get('/dashboard', auth, roleGuard('admin', 'superadmin'), getDashboard);
router.get('/sales', auth, roleGuard('admin', 'superadmin'), getSalesReport);
router.get('/customers', auth, roleGuard('admin', 'superadmin'), getCustomerAnalytics);

module.exports = router;
