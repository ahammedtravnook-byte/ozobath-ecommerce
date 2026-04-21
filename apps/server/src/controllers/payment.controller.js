// ============================================
// OZOBATH - Payment Controller (Razorpay)
// ============================================
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const { createNotification } = require('./notification.controller');
const { createAdminNotification } = require('./adminNotification.controller');

// ─── Razorpay Instance ───────────────────────────
let razorpayInstance = null;

const getRazorpay = () => {
    if (!razorpayInstance) {
        if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET ||
            env.RAZORPAY_KEY_ID === 'rzp_test_placeholder') {
            throw new ApiError(503, 'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
        }
        razorpayInstance = new Razorpay({
            key_id: env.RAZORPAY_KEY_ID,
            key_secret: env.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayInstance;
};

// ─── Create Razorpay Payment Order ───────────────
// Does NOT create a DB order. Computes amount server-side from cart.
const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { couponCode } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) throw new ApiError(400, 'Cart is empty.');

    let subtotal = 0;
    for (const item of cart.items) {
        if (!item.product || !item.product.isActive) continue;
        subtotal += item.product.price * item.quantity;
    }

    let discount = 0;
    if (couponCode) {
        const coupon = await Coupon.findOne({
            code: couponCode.toUpperCase(),
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
        });
        if (coupon && subtotal >= coupon.minOrderAmount) {
            discount = coupon.type === 'percentage'
                ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
                : coupon.value;
            discount = Math.round(discount);
        }
    }

    const shippingCost = subtotal >= 999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shippingCost + tax - discount;

    const rzp = getRazorpay();
    const razorpayOrder = await rzp.orders.create({
        amount: Math.round(total * 100),
        currency: 'INR',
        notes: {
            customerEmail: req.user.email,
            customerName: req.user.name,
        },
    });

    sendResponse(res, 200, {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: env.RAZORPAY_KEY_ID,
    }, 'Razorpay order created');
});

// ─── Confirm Payment + Create DB Order ───────────
// Called AFTER Razorpay payment succeeds on the client.
// Verifies signature first — if valid, creates the order.
const confirmAndCreateOrder = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        shippingAddress,
        couponCode,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !shippingAddress) {
        throw new ApiError(400, 'Missing required payment confirmation parameters.');
    }

    // 1. Verify Razorpay signature before touching the database
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        throw new ApiError(400, 'Payment verification failed. Invalid signature.');
    }

    // 2. Read cart — must still have items (cart is only cleared here on success)
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) throw new ApiError(400, 'Cart is empty. Order may have already been placed.');

    // 3. Build order items and compute totals
    let subtotal = 0;
    const items = cart.items
        .filter(item => item.product && item.product.isActive)
        .map((item) => {
            const price = item.product.price;
            subtotal += price * item.quantity;
            return {
                product: item.product._id,
                name: item.product.name,
                image: item.product.images?.[0]?.url,
                price,
                quantity: item.quantity,
                variant: item.variant,
            };
        });

    if (items.length === 0) throw new ApiError(400, 'No active products in cart.');

    // 4. Apply coupon atomically
    let discount = 0;
    let couponId = null;
    if (couponCode) {
        const coupon = await Coupon.findOneAndUpdate(
            {
                code: couponCode.toUpperCase(),
                isActive: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() },
                $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
            },
            { $inc: { usedCount: 1 }, $push: { usedBy: req.user._id } },
            { new: false }
        );

        if (!coupon) throw new ApiError(400, 'Coupon is no longer valid.');
        if (subtotal < coupon.minOrderAmount) throw new ApiError(400, `Minimum order amount for coupon is ₹${coupon.minOrderAmount}.`);

        const userUsage = coupon.usedBy.filter(id => id.toString() === req.user._id.toString()).length;
        if (coupon.perUserLimit && userUsage >= coupon.perUserLimit) {
            await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: -1 }, $pull: { usedBy: req.user._id } });
            throw new ApiError(400, 'Coupon usage limit reached.');
        }

        discount = coupon.type === 'percentage'
            ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
            : coupon.value;
        discount = Math.round(discount);
        couponId = coupon._id;
    }

    const shippingCost = subtotal >= 999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shippingCost + tax - discount;

    // 5. Create confirmed order
    const order = await Order.create({
        user: req.user._id,
        items,
        shippingAddress,
        subtotal,
        shippingCost,
        discount,
        tax,
        total,
        coupon: couponId,
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        status: 'confirmed',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        statusHistory: [
            { status: 'pending', date: new Date(), note: 'Order placed' },
            { status: 'confirmed', date: new Date(), note: `Payment received via Razorpay (${razorpay_payment_id})` },
        ],
    });

    // 6. Reduce stock
    for (const item of items) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity, salesCount: item.quantity },
        });
    }

    // 7. Clear cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalAmount: 0 });

    // 8. Notify customer and admins
    await createNotification(
        req.user._id,
        'order_placed',
        'Order Confirmed!',
        `Your order #${order.orderNumber} for ₹${total.toLocaleString('en-IN')} has been confirmed.`,
        { orderId: order._id, orderNumber: order.orderNumber }
    );

    await createAdminNotification(
        'new_order',
        `New Order #${order.orderNumber}`,
        `₹${total.toLocaleString('en-IN')} — ${items.length} item(s) from ${req.user.name || req.user.email}`,
        `/orders/${order._id}`,
        { orderId: order._id, orderNumber: order.orderNumber, total }
    );

    for (const item of items) {
        const updatedProduct = await Product.findById(item.product).select('name stock').lean();
        if (updatedProduct && updatedProduct.stock <= 5) {
            await createAdminNotification(
                'low_stock',
                'Low Stock Alert',
                `${updatedProduct.name} has only ${updatedProduct.stock} unit(s) remaining`,
                `/inventory`,
                { productId: item.product, stock: updatedProduct.stock }
            );
        }
    }

    sendResponse(res, 201, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: 'paid',
    }, 'Payment confirmed and order placed successfully');
});

// ─── Get Payment Details (Admin) ─────────────────
const getPaymentDetails = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId)
        .select('razorpayOrderId razorpayPaymentId paymentStatus paymentMethod total orderNumber');

    if (!order) throw new ApiError(404, 'Order not found');

    let razorpayDetails = null;

    if (order.razorpayPaymentId) {
        try {
            const rzp = getRazorpay();
            razorpayDetails = await rzp.payments.fetch(order.razorpayPaymentId);
        } catch (err) {
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

// ─── COD — Confirm order as Cash on Delivery ─────
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

    await Cart.findOneAndUpdate({ user: order.user }, { items: [], totalAmount: 0 });

    sendResponse(res, 200, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: 'pending',
        paymentMethod: 'cod',
    }, 'COD order placed successfully');
});

module.exports = {
    createRazorpayOrder,
    confirmAndCreateOrder,
    getPaymentDetails,
    initiateRefund,
    placeCodOrder,
};
