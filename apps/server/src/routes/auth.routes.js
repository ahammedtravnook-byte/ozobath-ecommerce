// ============================================
// OZOBATH - Auth Routes
// ============================================
const router = require('express').Router();
const auth = require('../middleware/auth');
const { authLimiter, refreshLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const S = require('../schemas');
const {
  register, login, loginOrRegister, refreshAccessToken, logout,
  getProfile, updateProfile, addAddress, updateAddress, deleteAddress,
} = require('../controllers/auth.controller');

router.post('/register', authLimiter, validate(S.register), register);
router.post('/login', authLimiter, validate(S.login), login);
router.post('/quick-login', authLimiter, validate(S.login), loginOrRegister);
router.post('/refresh', refreshLimiter, refreshAccessToken);
router.post('/logout', auth, logout);
router.get('/me', auth, getProfile);
router.put('/me', auth, validate(S.updateProfile), updateProfile);

// Address management
router.post('/addresses', auth, validate(S.address), addAddress);
router.put('/addresses/:addressId', auth, validate(S.address), updateAddress);
router.delete('/addresses/:addressId', auth, deleteAddress);

module.exports = router;
