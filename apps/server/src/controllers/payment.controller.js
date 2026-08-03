// ============================================
// OZOBATH - Payment Controller (Razorpay)
// ============================================
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const PendingCheckout = require('../models/PendingCheckout');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { calculateTotals } = require('../utils/calculateTotals');
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
        // Warn if test keys are used in production
        if (env.NODE_ENV === 'production' && env.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
            console.warn('⚠️  WARNING: Razorpay is using TEST keys in PRODUCTION mode. Switch to live keys (rzp_live_xxx) for real payments.');
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

    // Look up the coupon for pricing only — usage is claimed at confirm time.
    let coupon = null;
    if (couponCode) {
        coupon = await Coupon.findOne({
            code: couponCode.toUpperCase(),
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
        });
    }

    const { subtotal, shippingCost, tax, discount, total, taxableValue, activeItems } =
        calculateTotals(cart.items, coupon);

    if (activeItems.length === 0) throw new ApiError(400, 'No active products in cart.');
    if (total <= 0) throw new ApiError(400, 'Order total must be greater than zero.');

    const rzp = getRazorpay();
    const razorpayOrder = await rzp.orders.create({
        amount: Math.round(total * 100),
        currency: 'INR',
        notes: {
            customerEmail: req.user.email,
            customerName: req.user.name,
        },
    });

    // Freeze what we just quoted. Confirm builds the order from this snapshot,
    // never from the live cart, so editing the cart mid-payment cannot change
    // what gets charged or what gets recorded.
    await PendingCheckout.create({
        razorpayOrderId: razorpayOrder.id,
        user: req.user._id,
        items: activeItems.map((item) => ({
            product: item.product._id,
            name: item.product.name,
            image: item.product.images?.[0]?.url,
            price: item.product.price,
            quantity: item.quantity,
            variant: item.variant,
        })),
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        // Freeze the tax treatment too — flipping TAX_MODE between quote and
        // confirm must not change what this already-quoted order records.
        taxableValue,
        taxMode: env.TAX_MODE,
        taxRate: env.TAX_RATE,
        couponCode: coupon ? coupon.code : undefined,
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

    // 1. Verify Razorpay signature before touching the database.
    // timingSafeEqual over a constant-length hex digest — avoids leaking
    // information through comparison time on a forged signature.
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    const signatureValid =
        typeof razorpay_signature === 'string' &&
        razorpay_signature.length === expectedSignature.length &&
        crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'utf8'),
            Buffer.from(razorpay_signature, 'utf8')
        );

    if (!signatureValid) {
        throw new ApiError(400, 'Payment verification failed. Invalid signature.');
    }

    // 2. Idempotency: if this payment already produced an order, return it.
    // A valid replay is not an error — the browser handler and a retry (or a
    // future webhook) can both legitimately arrive. The unique index on
    // razorpayOrderId is the real guard; this is the fast, friendly path.
    const existingOrder = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (existingOrder) {
        return sendResponse(res, 200, {
            orderId: existingOrder._id,
            orderNumber: existingOrder.orderNumber,
            paymentStatus: existingOrder.paymentStatus,
        }, 'Order already confirmed for this payment');
    }

    // 3. Load the frozen quote. This — not the live cart — is what the
    // customer was charged for.
    const snapshot = await PendingCheckout.findOne({
        razorpayOrderId: razorpay_order_id,
        user: req.user._id,
    });

    if (!snapshot) {
        throw new ApiError(
            400,
            'Checkout session not found or expired. If you were charged, contact support with your payment ID.'
        );
    }

    const items = snapshot.items.map((item) => ({
        product: item.product,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant,
    }));

    if (items.length === 0) throw new ApiError(400, 'Checkout session contained no items.');

    const { subtotal, shippingCost, tax, total, taxableValue, taxMode, taxRate } = snapshot;

    // 4. Cross-check against Razorpay: confirm they actually captured the
    // amount we quoted. The signature proves a payment happened; this proves
    // it was for the right amount, independent of our own records.
    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.fetch(razorpay_order_id);
    const expectedPaise = Math.round(total * 100);
    const paidPaise = Number(rzpOrder?.amount_paid);

    if (!Number.isFinite(paidPaise) || paidPaise !== expectedPaise) {
        const capturedLabel = Number.isFinite(paidPaise) ? `₹${paidPaise / 100}` : 'an unknown amount';
        throw new ApiError(
            400,
            `Payment amount mismatch. Expected ₹${total}, Razorpay captured ${capturedLabel}. Order not created — contact support with payment ID ${razorpay_payment_id}.`
        );
    }

    // 5. Claim coupon usage atomically. Deliberately after the amount check,
    // so a failed verification never consumes the customer's coupon. Uses the
    // code recorded in the snapshot — not the client's, which could differ.
    let couponId = null;
    const snapshotCouponCode = snapshot.couponCode;
    if (snapshotCouponCode) {
        const coupon = await Coupon.findOneAndUpdate(
            {
                code: snapshotCouponCode.toUpperCase(),
                isActive: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() },
                $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
            },
            { $inc: { usedCount: 1 }, $push: { usedBy: req.user._id } },
            { new: false }
        );

        // The customer has already paid, and the amount they paid included this
        // discount. Refusing the order here would strand their money, so an
        // exhausted coupon is logged and the honoured price stands.
        if (!coupon) {
            console.warn(`Coupon ${snapshotCouponCode} no longer claimable at confirm for payment ${razorpay_payment_id}; honouring quoted price.`);
        } else {
            couponId = coupon._id;

            const userUsage = coupon.usedBy.filter(id => id.toString() === req.user._id.toString()).length;
            if (coupon.perUserLimit && userUsage >= coupon.perUserLimit) {
                await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: -1 }, $pull: { usedBy: req.user._id } });
                console.warn(`Coupon ${snapshotCouponCode} per-user limit exceeded at confirm for payment ${razorpay_payment_id}; honouring quoted price.`);
                couponId = null;
            }
        }
    }

    const discount = snapshot.discount;

    // 6. Create confirmed order.
    // The unique index on razorpayOrderId is what actually prevents duplicates:
    // the step-2 lookup can be passed by several concurrent replays before any
    // of them writes, so the database has to be the arbiter. A duplicate-key
    // error here means another request won the race — return its order rather
    // than failing, and do not run the side effects below twice.
    let order;
    try {
        order = await Order.create({
        user: req.user._id,
        items,
        shippingAddress,
        subtotal,
        shippingCost,
        discount,
        tax,
        total,
        taxableValue,
        taxMode,
        taxRate,
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
    } catch (err) {
        if (err.code === 11000) {
            const winner = await Order.findOne({ razorpayOrderId: razorpay_order_id });
            if (winner) {
                return sendResponse(res, 200, {
                    orderId: winner._id,
                    orderNumber: winner.orderNumber,
                    paymentStatus: winner.paymentStatus,
                }, 'Order already confirmed for this payment');
            }
        }
        throw err;
    }

    // 6b. Mark the snapshot consumed — the order now owns this payment.
    await PendingCheckout.updateOne(
        { _id: snapshot._id },
        { consumedAt: new Date(), order: order._id }
    );

    // 7. Reduce stock
    for (const item of items) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity, salesCount: item.quantity },
        });
    }

    // 8. Clear cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalAmount: 0 });

    // 9. Notify customer and admins
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
