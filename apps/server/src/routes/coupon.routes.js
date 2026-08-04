const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { writeLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const S = require('../schemas');
const {
  validateCoupon, autoApplyCoupon, getCouponAnalytics,
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
} = require('../controllers/remaining.controller');

router.post('/validate', auth, writeLimiter, validate(S.validateCoupon), validateCoupon);
router.get('/auto-apply', auth, autoApplyCoupon);
router.get('/analytics', auth, roleGuard('admin', 'superadmin'), getCouponAnalytics);
router.get('/', auth, roleGuard('admin', 'superadmin'), getCoupons);
router.post('/', auth, roleGuard('admin', 'superadmin'), validate(S.upsertCoupon), createCoupon);
router.put('/:id', auth, roleGuard('admin', 'superadmin'), updateCoupon);
router.delete('/:id', auth, roleGuard('admin', 'superadmin'), deleteCoupon);

module.exports = router;
