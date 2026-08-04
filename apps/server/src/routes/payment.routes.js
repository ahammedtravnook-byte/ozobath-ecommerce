const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const S = require('../schemas');
const {
    createRazorpayOrder,
    confirmAndCreateOrder,
    getPaymentDetails,
    initiateRefund,
    placeCodOrder,
    handleRazorpayWebhook,
} = require('../controllers/payment.controller');

// ─── Webhook (public, signature-verified) ────────
// The browser calling /confirm is not a reliable delivery mechanism: a
// customer who closes the tab after paying leaves money captured with no
// order. Razorpay retries this endpoint independently of the browser.
router.post('/webhook', handleRazorpayWebhook);

// Customer routes
router.post('/create-order', auth, paymentLimiter, validate(S.createRazorpayOrder), createRazorpayOrder);   // Step 1: init Razorpay (no DB order)
router.post('/confirm', auth, paymentLimiter, validate(S.confirmPayment), confirmAndCreateOrder);      // Step 2: verify + create order
router.post('/cod', auth, paymentLimiter, validate(S.codOrder), placeCodOrder);                  // COD confirmation

// Admin routes
router.get('/:orderId/details', auth, roleGuard('admin', 'superadmin'), getPaymentDetails);
router.post('/:orderId/refund', auth, roleGuard('admin', 'superadmin'), validate(S.refund), initiateRefund);

module.exports = router;
