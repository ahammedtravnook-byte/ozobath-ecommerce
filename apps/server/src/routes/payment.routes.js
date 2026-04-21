const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const {
    createRazorpayOrder,
    confirmAndCreateOrder,
    getPaymentDetails,
    initiateRefund,
    placeCodOrder,
} = require('../controllers/payment.controller');

// Customer routes
router.post('/create-order', auth, createRazorpayOrder);   // Step 1: init Razorpay (no DB order)
router.post('/confirm', auth, confirmAndCreateOrder);       // Step 2: verify + create order
router.post('/cod', auth, placeCodOrder);                   // COD confirmation

// Admin routes
router.get('/:orderId/details', auth, roleGuard('admin', 'superadmin'), getPaymentDetails);
router.post('/:orderId/refund', auth, roleGuard('admin', 'superadmin'), initiateRefund);

module.exports = router;
