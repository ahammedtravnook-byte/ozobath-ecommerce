const router = require('express').Router();
const auth = require('../middleware/auth');
const { createRazorpayOrder, verifyPayment } = require('../controllers/remaining.controller');

router.post('/create-order', auth, createRazorpayOrder);
router.post('/verify', auth, verifyPayment);

module.exports = router;
