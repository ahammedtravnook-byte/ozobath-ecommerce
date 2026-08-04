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
const { decrementStock } = require('../utils/stock');
const { canTransition } = require('../utils/orderStateMachine');
const { logActivity } = require('./activityLog.controller');
const { cleanText } = require('../utils/sanitize');
const { withTransaction } = require('../utils/withTransaction');
const env = require('../config/env');
const { issueInvoice } = require('../services/invoice.service');
const { renderInvoicePdf } = require('../services/invoicePdf.service');
const { sendInvoiceEmail } = require('../services/mailer.service');
const { createNotification } = require('./notification.controller');
const { createAdminNotification } = require('./adminNotification.controller');

// ─── Invoice issuance (never fatal) ──────────────
// Both order-creation paths call this. A tax invoice requires SELLER_GSTIN
// to be configured; until it is, orders must still be recorded. The order is
// the record of a payment that actually happened — the invoice is a document
// about it, and a missing document is recoverable while a missing order is
// not. Returns the invoice sub-document, or null if it could not be issued.
const tryIssueInvoice = async (draft, session, ref) => {
    try {
        return await issueInvoice(draft, session);
    } catch (err) {
        if (err.code === 'INVOICE_NOT_CONFIGURED') {
            console.warn(`[invoice] Skipped for ${ref}: ${err.message}`);
        } else {
            console.error(`[invoice] Issue failed for ${ref}: ${err.message}`);
        }
        return null;
    }
};

// ─── Confirmation email (fire-and-forget) ────────
// Renders the invoice PDF and mails it. Never awaited by a request handler:
// a customer who has paid must get their response immediately, and neither
// PDF rendering nor SMTP may hold it up or fail it. Every failure mode here
// is recoverable — the invoice stays downloadable from My Orders.
const emailInvoice = (order, user) => {
    Promise.resolve()
        .then(async () => {
            const pdf = order.invoice?.number
                ? await renderInvoicePdf(order.toObject ? order.toObject() : order)
                : null;
            const result = await sendInvoiceEmail(order, user, pdf);

            if (result.sent && order.invoice?.number) {
                // Record the send so support can tell "never sent" apart from
                // "sent and the customer deleted it".
                await Order.updateOne(
                    { _id: order._id },
                    { $set: { 'invoice.emailedAt': new Date() } }
                );
            }
        })
        .catch((err) => {
            console.error(`[invoice] Email failed for ${order.orderNumber}: ${err.message}`);
        });
};

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

// Allowlist and clean a client-supplied shipping address. Previously the raw
// object was written onto the order, so a client could store arbitrary fields
// and unbounded strings on a document admins render.
const pickShippingAddress = (raw) => {
    if (!raw || typeof raw !== 'object') return undefined;
    const out = {};
    for (const key of ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'pincode']) {
        if (raw[key] !== undefined) out[key] = cleanText(raw[key], 200);
    }
    return Object.keys(out).length ? out : undefined;
};

// ─── Create Razorpay Payment Order ───────────────
// Does NOT create a DB order. Computes amount server-side from cart.
const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { couponCode, shippingAddress } = req.body;

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
            hsn: item.product.hsn,
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
        // Optional. If the client sends it here, a webhook-created order
        // (browser never returned to /confirm) is still shippable.
        shippingAddress: pickShippingAddress(shippingAddress),
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
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !req.body.shippingAddress) {
        throw new ApiError(400, 'Missing required payment confirmation parameters.');
    }

    const shippingAddress = pickShippingAddress(req.body.shippingAddress);
    if (!shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.pincode) {
        throw new ApiError(400, 'Shipping address must include line1, city and pincode.');
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
        hsn: item.hsn,
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

    const discount = snapshot.discount;

    // ─── 5-8. All database writes, atomically ────────────────
    // Claim coupon, create order, consume snapshot, decrement stock and clear
    // the cart are five writes that must all happen or none. Previously they
    // ran independently, so a crash between any two left permanent damage: a
    // burned coupon with no order, an order whose stock was never decremented,
    // or a cart still holding items the customer had just bought.
    //
    // Everything above this point — signature check, Razorpay fetch, amount
    // reconciliation — stays OUTSIDE the transaction deliberately. Network
    // calls inside a transaction hold locks for the duration of an external
    // round trip, and none of those steps write anything.
    //
    // On a deployment without transaction support this degrades to the
    // previous sequential behaviour rather than failing. See withTransaction.
    let order;
    let duplicateWinner = null;

    try {
        order = await withTransaction(async (session) => {
            const opts = session ? { session } : {};

            // 5. Claim coupon usage. After the amount check, so a failed
            // verification never consumes the customer's coupon. Uses the code
            // from the snapshot — not the client's, which could differ.
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
                    { new: false, ...opts }
                );

                // The customer has already paid, and the amount they paid
                // included this discount. Refusing the order here would strand
                // their money, so an exhausted coupon is logged and the
                // honoured price stands.
                if (!coupon) {
                    console.warn(`Coupon ${snapshotCouponCode} no longer claimable at confirm for payment ${razorpay_payment_id}; honouring quoted price.`);
                } else {
                    couponId = coupon._id;

                    const userUsage = coupon.usedBy.filter(id => id.toString() === req.user._id.toString()).length;
                    if (coupon.perUserLimit && userUsage >= coupon.perUserLimit) {
                        await Coupon.findByIdAndUpdate(
                            coupon._id,
                            { $inc: { usedCount: -1 }, $pull: { usedBy: req.user._id } },
                            opts
                        );
                        console.warn(`Coupon ${snapshotCouponCode} per-user limit exceeded at confirm for payment ${razorpay_payment_id}; honouring quoted price.`);
                        couponId = null;
                    }
                }
            }

            // 6. Create the confirmed order. The unique index on
            // razorpayOrderId is what actually prevents duplicates: the
            // step-2 lookup can be passed by several concurrent replays
            // before any of them writes, so the database has to be the
            // arbiter.
            //
            // The tax invoice is issued in the same transaction, so its
            // number is rolled back with the order rather than burned.
            //
            // Issuance is deliberately non-fatal: it needs SELLER_GSTIN, and
            // an order must never fail because the seller's tax config is
            // incomplete. The customer has already paid at this point —
            // refusing to record their order would be far worse than
            // recording it without an invoice, which can be issued later.
            const invoice = await tryIssueInvoice(
                { tax, shippingAddress },
                opts.session,
                razorpay_order_id
            );

            // Order.create([...], {session}) — the array form is required to
            // pass options through.
            const created = await Order.create([{
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
                ...(invoice ? { invoice } : {}),
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
            }], opts);

            const newOrder = created[0];

            // 6b. Mark the snapshot consumed — the order now owns this payment.
            await PendingCheckout.updateOne(
                { _id: snapshot._id },
                { consumedAt: new Date(), order: newOrder._id },
                opts
            );

            // 7. Reduce stock.
            for (const item of items) {
                await decrementStock(item.product, item.quantity, session);
            }

            // 8. Clear cart.
            await Cart.findOneAndUpdate(
                { user: req.user._id },
                { items: [], totalAmount: 0 },
                opts
            );

            return newOrder;
        });
    } catch (err) {
        // A duplicate key means another request (a replay, or the webhook)
        // won the race and already created this order. Return theirs rather
        // than failing, and do not re-run the side effects below.
        if (err.code === 11000) {
            duplicateWinner = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        }
        if (!duplicateWinner) throw err;
    }

    if (duplicateWinner) {
        return sendResponse(res, 200, {
            orderId: duplicateWinner._id,
            orderNumber: duplicateWinner.orderNumber,
            paymentStatus: duplicateWinner.paymentStatus,
        }, 'Order already confirmed for this payment');
    }

    // 9. Email the confirmation, with the tax invoice attached when one was
    // issued. Fire-and-forget: the payment is already recorded and the
    // response must not wait on SMTP, nor fail if the mail server is down.
    // The customer can always download the invoice from My Orders.
    emailInvoice(order, req.user);

    // 10. Notify customer and admins
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

    // One query for all items rather than one per item.
    const lowStock = await Product.find({
        _id: { $in: items.map((i) => i.product) },
        stock: { $lte: 5 },
    }).select('name stock').lean();

    for (const p of lowStock) {
        await createAdminNotification(
            'low_stock',
            'Low Stock Alert',
            `${p.name} has only ${p.stock} unit(s) remaining`,
            `/inventory`,
            { productId: p._id, stock: p.stock }
        );
    }

    sendResponse(res, 201, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: 'paid',
    }, 'Payment confirmed and order placed successfully');
});

// ─── Razorpay Webhook ────────────────────────────
// Safety net for the browser never calling /confirm — a customer who closes
// the tab after paying previously left money captured with no order.
//
// Deliberately narrow: it creates the order from the frozen snapshot and
// nothing else. The signature is over the RAW body, so this route needs the
// raw bytes; express.json exposes them via `req.rawBody` (configured in
// app.js) — without that, a re-serialised body produces a different digest.
const handleRazorpayWebhook = asyncHandler(async (req, res) => {
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        console.error('[payment] Webhook rejected: RAZORPAY_WEBHOOK_SECRET is not configured.');
        throw new ApiError(401, 'Webhook authentication is not configured.');
    }

    const signature = req.header('x-razorpay-signature') || '';
    const payload = req.rawBody;

    if (!payload) {
        console.error('[payment] Webhook rejected: raw body unavailable.');
        throw new ApiError(400, 'Raw body required for signature verification.');
    }

    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const sigBuf = Buffer.from(String(signature), 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        console.warn(`[payment] Webhook rejected: bad signature from ${req.ip}`);
        throw new ApiError(401, 'Invalid webhook signature.');
    }

    const event = req.body?.event;
    const entity = req.body?.payload?.payment?.entity;

    // Only act on a successful capture. Everything else is acknowledged so
    // Razorpay stops retrying.
    if (event !== 'payment.captured' || !entity) {
        return res.status(200).json({ success: true, message: 'Event ignored' });
    }

    const razorpayOrderId = entity.order_id;
    const razorpayPaymentId = entity.id;

    if (!razorpayOrderId || !razorpayPaymentId) {
        return res.status(200).json({ success: true, message: 'Incomplete payload, ignored' });
    }

    // Idempotent: the browser path may already have created this order.
    const existing = await Order.findOne({ razorpayOrderId });
    if (existing) {
        return res.status(200).json({ success: true, message: 'Order already exists' });
    }

    const snapshot = await PendingCheckout.findOne({ razorpayOrderId });
    if (!snapshot) {
        // Nothing to build an order from. Log loudly — this is a captured
        // payment with no matching quote and needs manual reconciliation.
        console.error(
            `[payment] Captured payment ${razorpayPaymentId} for order ${razorpayOrderId} has no PendingCheckout snapshot. Manual reconciliation required.`
        );
        return res.status(200).json({ success: true, message: 'No snapshot, logged for reconciliation' });
    }

    // Confirm the captured amount matches what we quoted.
    const expectedPaise = Math.round(snapshot.total * 100);
    const capturedPaise = Number(entity.amount);
    if (!Number.isFinite(capturedPaise) || capturedPaise !== expectedPaise) {
        console.error(
            `[payment] Webhook amount mismatch for ${razorpayOrderId}: expected ${expectedPaise} paise, captured ${capturedPaise}. Order not created.`
        );
        return res.status(200).json({ success: true, message: 'Amount mismatch, logged' });
    }

    // Claim the coupon, mirroring the browser path.
    let couponId = null;
    if (snapshot.couponCode) {
        const coupon = await Coupon.findOneAndUpdate(
            {
                code: snapshot.couponCode.toUpperCase(),
                isActive: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() },
                $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
            },
            { $inc: { usedCount: 1 }, $push: { usedBy: snapshot.user } },
            { new: false }
        );
        if (coupon) couponId = coupon._id;
    }

    // The webhook fires when the browser never reached /confirm, so the
    // snapshot may carry no address. Without a delivery state the place of
    // supply is unknown and splitTax falls back to IGST — see gst.js for why
    // that is the safe default rather than a guess at CGST+SGST.
    const invoice = await tryIssueInvoice(
        { tax: snapshot.tax, shippingAddress: snapshot.shippingAddress },
        null,
        razorpayOrderId
    );

    let order;
    try {
        order = await Order.create({
            user: snapshot.user,
            items: snapshot.items.map((i) => ({
                product: i.product, name: i.name, image: i.image,
                price: i.price, quantity: i.quantity, variant: i.variant, hsn: i.hsn,
            })),
            ...(invoice ? { invoice } : {}),
            // The snapshot holds no address — the browser supplies it at
            // /confirm. Recorded as unset so fulfilment sees it is missing
            // rather than shipping to a blank address.
            shippingAddress: snapshot.shippingAddress || undefined,
            subtotal: snapshot.subtotal,
            shippingCost: snapshot.shippingCost,
            discount: snapshot.discount,
            tax: snapshot.tax,
            total: snapshot.total,
            taxableValue: snapshot.taxableValue,
            taxMode: snapshot.taxMode,
            taxRate: snapshot.taxRate,
            coupon: couponId,
            paymentMethod: 'razorpay',
            paymentStatus: 'paid',
            status: 'confirmed',
            razorpayOrderId,
            razorpayPaymentId,
            statusHistory: [
                { status: 'pending', date: new Date(), note: 'Order placed' },
                { status: 'confirmed', date: new Date(), note: `Payment captured via Razorpay webhook (${razorpayPaymentId})` },
            ],
        });
    } catch (err) {
        if (err.code === 11000) {
            // The browser path won the race.
            return res.status(200).json({ success: true, message: 'Order already exists' });
        }
        throw err;
    }

    await PendingCheckout.updateOne({ _id: snapshot._id }, { consumedAt: new Date(), order: order._id });

    for (const item of order.items) {
        await decrementStock(item.product, item.quantity);
    }

    await Cart.findOneAndUpdate({ user: snapshot.user }, { items: [], totalAmount: 0 });

    console.warn(
        `[payment] Order ${order.orderNumber} created from webhook (browser never confirmed). Shipping address may be missing.`
    );

    res.status(200).json({ success: true, message: 'Order created from webhook' });
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

    // Ask the gateway what it actually holds. Our own `order.total` is what we
    // intended to charge; `amount_paid` less `amount_refunded` is what can
    // genuinely be returned. Trusting our record instead would let a stale or
    // tampered order document authorise a refund the payment cannot cover.
    let payment;
    try {
        payment = await rzp.payments.fetch(order.razorpayPaymentId);
    } catch (err) {
        throw new ApiError(502, 'Could not verify the payment with Razorpay. Refund not attempted.');
    }

    const capturedPaise = Number(payment?.amount);
    const alreadyRefundedPaise = Number(payment?.amount_refunded) || 0;

    if (!Number.isFinite(capturedPaise) || capturedPaise <= 0) {
        throw new ApiError(400, 'Razorpay reports no captured amount for this payment. Refund not attempted.');
    }

    const refundablePaise = capturedPaise - alreadyRefundedPaise;
    if (refundablePaise <= 0) {
        throw new ApiError(400, 'This payment has already been fully refunded at the gateway.');
    }

    // Default to the full remaining balance; otherwise validate what was asked.
    let refundAmountPaise;
    if (amount === undefined || amount === null) {
        refundAmountPaise = refundablePaise;
    } else {
        const requested = typeof amount === 'string' ? Number(amount) : amount;
        if (typeof requested !== 'number' || !Number.isFinite(requested) || requested <= 0) {
            throw new ApiError(400, 'Refund amount must be a positive number of rupees.');
        }
        refundAmountPaise = Math.round(requested * 100);
        if (refundAmountPaise > refundablePaise) {
            throw new ApiError(
                400,
                `Refund amount ₹${requested} exceeds the refundable balance of ₹${refundablePaise / 100} for this payment.`
            );
        }
    }

    const refund = await rzp.payments.refund(order.razorpayPaymentId, {
        amount: refundAmountPaise,
        notes: {
            reason: reason || 'Customer requested refund',
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
        },
    });

    const refundAmountRupees = refundAmountPaise / 100;

    // Record the refund before deciding the order's payment state, so a
    // partial refund is visible rather than collapsing into a single flag.
    order.refunds.push({
        refundId: refund.id,
        amount: refundAmountRupees,
        status: refund.status,
        reason: reason || 'Customer requested refund',
        createdBy: req.user._id,
    });
    order.refundedTotal = Number((order.refundedTotal + refundAmountRupees).toFixed(2));

    // Only a full refund closes the order. A partial one leaves it live —
    // previously any refund marked the order `refunded` and `cancelled`,
    // which silently cancelled orders that were only partly refunded.
    const fullyRefunded = (alreadyRefundedPaise + refundAmountPaise) >= capturedPaise;
    if (fullyRefunded) {
        order.paymentStatus = 'refunded';
        if (canTransition(order.status, 'cancelled')) order.status = 'cancelled';
    }

    order.statusHistory.push({
        status: fullyRefunded ? 'refunded' : 'partially_refunded',
        date: new Date(),
        note: `Refund of ₹${refundAmountRupees.toLocaleString('en-IN')} initiated (${refund.id}). Reason: ${reason || 'N/A'}`,
        updatedBy: req.user._id,
    });

    await order.save();

    await logActivity(req, 'initiate_refund', 'Order', order._id, {
        orderNumber: order.orderNumber,
        refundId: refund.id,
        amount: refundAmountRupees,
        refundedTotal: order.refundedTotal,
        fullyRefunded,
        reason: reason || null,
    });

    sendResponse(res, 200, {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        refundedTotal: order.refundedTotal,
        fullyRefunded,
    }, fullyRefunded ? 'Refund initiated successfully' : 'Partial refund initiated successfully');
});

// ─── COD — Confirm order as Cash on Delivery ─────
const placeCodOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) throw new ApiError(404, 'Order not found');

    // Without these checks a customer could re-POST this against an order
    // already paid by card, flipping it to COD/pending — wiping the record
    // that it was paid, so delivery would later collect the money again.
    if (order.razorpayPaymentId || order.paymentStatus === 'paid') {
        throw new ApiError(400, 'This order has already been paid and cannot be converted to Cash on Delivery.');
    }
    if (order.status !== 'pending') {
        throw new ApiError(400, `Cannot place a COD order for an order with status "${order.status}".`);
    }

    order.paymentMethod = 'cod';
    order.paymentStatus = 'pending';
    order.status = 'confirmed';
    order.statusHistory.push({
        status: 'confirmed',
        date: new Date(),
        note: 'Order confirmed with Cash on Delivery',
    });

    await order.save();

    // Reserve inventory. The other two order paths decrement stock; this one
    // did not, so a COD order held nothing.
    for (const item of order.items) {
        await decrementStock(item.product, item.quantity);
    }

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
    handleRazorpayWebhook,
};
