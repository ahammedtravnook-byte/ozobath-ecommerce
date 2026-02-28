// ============================================
// OZOBATH - Rate Limiter
// ============================================
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 500, // Limit each IP to 500 requests per `window`
  message: {
    success: false,
    message: 'Too many requests. Please try again after 2 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 50, // Limit each IP to 50 login requests per `window`
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 2 minutes.',
  },
});

module.exports = { apiLimiter, authLimiter };
