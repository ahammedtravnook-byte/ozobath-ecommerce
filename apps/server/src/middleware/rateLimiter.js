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
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Per-purpose limiters ────────────────────────
// Everything below previously relied on the 500-req/2min global bucket,
// which is far too permissive for endpoints that cost money, create
// third-party records, or accept unauthenticated writes.

const makeLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { success: false, message },
  standardHeaders: true,
  legacyHeaders: false,
});

// Each call creates a real Razorpay order and a PendingCheckout row.
const paymentLimiter = makeLimiter(
  5 * 60 * 1000, 20,
  'Too many payment attempts. Please wait a few minutes and try again.'
);

// Token grinding / session churn.
const refreshLimiter = makeLimiter(
  5 * 60 * 1000, 30,
  'Too many token refresh attempts. Please try again shortly.'
);

// Unauthenticated writes: enquiries, service requests, bookings, newsletter.
// These store documents and notify admins, so they are a spam vector.
const publicWriteLimiter = makeLimiter(
  10 * 60 * 1000, 10,
  'Too many submissions from this address. Please try again later.'
);

// Coupon-code brute force, review spam.
const writeLimiter = makeLimiter(
  5 * 60 * 1000, 40,
  'Too many requests. Please slow down.'
);

module.exports = {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  refreshLimiter,
  publicWriteLimiter,
  writeLimiter,
};
