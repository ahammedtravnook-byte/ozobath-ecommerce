const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon } = require('../controllers/remaining.controller');

router.post('/validate', auth, validateCoupon);
router.get('/', auth, roleGuard('admin', 'superadmin'), getCoupons);
router.post('/', auth, roleGuard('admin', 'superadmin'), createCoupon);
router.put('/:id', auth, roleGuard('admin', 'superadmin'), updateCoupon);
router.delete('/:id', auth, roleGuard('admin', 'superadmin'), deleteCoupon);

module.exports = router;
