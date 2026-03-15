// ============================================
// OZOBATH - Payment Controller (Razorpay)
// ============================================
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

// ─── Razorpay Instance ───────────────────────────
let razorpayInstance = null;

const getRazorpay = () => {
    if (!razorpayInstance) {
        if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET ||
            env.RAZORPAY_KEY_ID === 'rzp_test_placeholder') {
            throw new ApiError(503, 'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.');
        }
        razorpayInstance = new Razorpay({
            key_id: env.RAZORPAY_KEY_ID,
            key_secret: env.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayInstance;
};

// ─── Create Razorpay Order ───────────────────────
const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
        throw new ApiError(400, 'Amount and orderId are required');
    }

    // Validate the order exists and belongs to the user
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    // Prevent double-payment
    if (order.paymentStatus === 'paid') {
        throw new ApiError(400, 'This order has already been paid');
    }

    const rzp = getRazorpay();

    // Amount in paise (smallest currency unit)
    const amountInPaise = Math.round(order.total * 100);

    const razorpayOrder = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber || orderId,
        notes: {
            orderId: orderId,
            customerEmail: req.user.email,
            customerName: req.user.name,
        },
    });

    // Store the Razorpay order ID
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    sendResponse(res, 200, {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: env.RAZORPAY_KEY_ID,
    }, 'Razorpay order created');
});

// ─── Verify Payment ──────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
        throw new ApiError(400, 'Missing payment verification parameters');
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        // Payment verification failed — mark as failed
        await Order.findByIdAndUpdate(orderId, {
            paymentStatus: 'failed',
            $push: {
                statusHistory: {
                    status: 'payment_failed',
                    date: new Date(),
                    note: 'Razorpay signature verification failed',
                },
            },
        });
        throw new ApiError(400, 'Payment verification failed. Invalid signature.');
    }

    // Update order with payment details
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentStatus = 'paid';
    order.status = 'confirmed';

    order.statusHistory.push({
        status: 'confirmed',
        date: new Date(),
        note: `Payment received via Razorpay (${razorpay_payment_id})`,
    });

    await order.save();

    sendResponse(res, 200, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: 'paid',
    }, 'Payment verified successfully');
});

// ─── Get Payment Details (Admin) ─────────────────
const getPaymentDetails = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId)
        .select('razorpayOrderId razorpayPaymentId paymentStatus paymentMethod total orderNumber');

    if (!order) throw new ApiError(404, 'Order not found');

    let razorpayDetails = null;

    // Fetch from Razorpay if payment ID exists
    if (order.razorpayPaymentId) {
        try {
            const rzp = getRazorpay();
            razorpayDetails = await rzp.payments.fetch(order.razorpayPaymentId);
        } catch (err) {
            // Razorpay fetch failed — return what we have
            razorpayDetails = { error: 'Could not fetch from Razorpay', paymentId: order.razorpayPaymentId };
        }
    }

    sendResponse(res, 200, {
        order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            total: order.total,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            razorpayOrderId: order.razorpayOrderId,
            razorpayPaymentId: order.razorpayPaymentId,
        },
        razorpayDetails,
    }, 'Payment details fetched');
});

// ─── Initiate Refund (Admin) ─────────────────────
const initiateRefund = asyncHandler(async (req, res) => {
    const { amount, reason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) throw new ApiError(404, 'Order not found');
    if (!order.razorpayPaymentId) throw new ApiError(400, 'No payment found for this order');
    if (order.paymentStatus === 'refunded') throw new ApiError(400, 'Order already refunded');

    const rzp = getRazorpay();

    const refundAmount = amount ? Math.round(amount * 100) : Math.round(order.total * 100);

    const refund = await rzp.payments.refund(order.razorpayPaymentId, {
        amount: refundAmount,
        notes: {
            reason: reason || 'Customer requested refund',
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
        },
    });

    order.paymentStatus = 'refunded';
    order.status = 'cancelled';
    order.statusHistory.push({
        status: 'refunded',
        date: new Date(),
        note: `Refund of ₹${(refundAmount / 100).toLocaleString()} initiated (${refund.id}). Reason: ${reason || 'N/A'}`,
        updatedBy: req.user._id,
    });

    await order.save();

    sendResponse(res, 200, {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
    }, 'Refund initiated successfully');
});

// ─── COD Fallback — Place order without payment ──
const placeCodOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) throw new ApiError(404, 'Order not found');

    order.paymentMethod = 'cod';
    order.paymentStatus = 'pending';
    order.status = 'confirmed';

    order.statusHistory.push({
        status: 'confirmed',
        date: new Date(),
        note: 'Order confirmed with Cash on Delivery',
    });

    await order.save();

    sendResponse(res, 200, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: 'pending',
        paymentMethod: 'cod',
    }, 'COD order placed successfully');
});

module.exports = {
    createRazorpayOrder,
    verifyPayment,
    getPaymentDetails,
    initiateRefund,
    placeCodOrder,
};
