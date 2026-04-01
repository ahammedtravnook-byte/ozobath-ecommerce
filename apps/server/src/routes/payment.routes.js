const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const {
    createRazorpayOrder,
    verifyPayment,
    getPaymentDetails,
    initiateRefund,
    placeCodOrder,
} = require('../controllers/payment.controller');

// Customer routes
router.post('/create-order', auth, createRazorpayOrder);
router.post('/verify', auth, verifyPayment);
router.post('/cod', auth, placeCodOrder);

// Admin routes
router.get('/:orderId/details', auth, roleGuard('admin', 'superadmin'), getPaymentDetails);
router.post('/:orderId/refund', auth, roleGuard('admin', 'superadmin'), initiateRefund);

module.exports = router;
