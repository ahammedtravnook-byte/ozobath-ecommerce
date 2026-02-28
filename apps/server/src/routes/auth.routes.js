// ============================================
// OZOBATH - Auth Routes
// ============================================
const router = require('express').Router();
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  register, login, loginOrRegister, refreshAccessToken, logout,
  getProfile, updateProfile, addAddress, updateAddress, deleteAddress,
} = require('../controllers/auth.controller');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/quick-login', authLimiter, loginOrRegister);
router.post('/refresh', refreshAccessToken);
router.post('/logout', auth, logout);
router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);

// Address management
router.post('/addresses', auth, addAddress);
router.put('/addresses/:addressId', auth, updateAddress);
router.delete('/addresses/:addressId', auth, deleteAddress);

module.exports = router;
