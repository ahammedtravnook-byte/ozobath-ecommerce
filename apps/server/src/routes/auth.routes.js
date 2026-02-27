const router = require('express').Router();
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { register, login, refreshAccessToken, logout, getProfile, updateProfile } = require('../controllers/auth.controller');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', auth, logout);
router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);

module.exports = router;
