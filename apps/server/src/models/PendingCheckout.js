// ============================================
// OZOBATH - Pending Checkout (priced cart snapshot)
// ============================================
// Written when a Razorpay order is created, read when the payment is
// confirmed. Freezes exactly what was priced and quoted to Razorpay.
//
// Why this exists: confirm used to re-read the live cart, so a cart edited
// in another tab between "create order" and "pay" produced a DB order whose
// total did not match the amount actually captured. The snapshot makes that
// drift impossible — the order is built from what the customer was charged
// for, not from whatever the cart happens to hold at confirm time.
//
// These are disposable. A row per abandoned checkout is fine: it holds no
// stock, burns no coupon usage, and the TTL index below reaps it.

const mongoose = require('mongoose');

const snapshotItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: String,
    price: { type: Number, required: true },   // price at quote time
    quantity: { type: Number, required: true, min: 1 },
    variant: String,
}, { _id: false });

const pendingCheckoutSchema = new mongoose.Schema({
    // Razorpay's order id — the join key between the quote and the payment.
    razorpayOrderId: { type: String, required: true, unique: true, index: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    items: { type: [snapshotItemSchema], required: true },

    // Frozen totals. These are what Razorpay was asked to collect.
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    // Tax treatment frozen at quote time, so flipping TAX_MODE mid-flight
    // cannot change what an already-quoted order records.
    taxableValue: { type: Number },
    taxMode: { type: String, enum: ['inclusive', 'exclusive'] },
    taxRate: { type: Number },

    // Coupon recorded by code, not claimed. Usage is still claimed atomically
    // at confirm time so an abandoned checkout never consumes a coupon.
    couponCode: String,

    // Shipping address captured at quote time, when the client supplies it.
    // The browser sends the authoritative address to /confirm; this copy
    // exists so an order created by the webhook (browser never returned) is
    // still shippable rather than having a blank address.
    shippingAddress: {
        fullName: String,
        phone: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
    },

    // Set once the snapshot has produced an order, so a replay is visible
    // even if the Order row were later removed.
    consumedAt: Date,
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

    // TTL: MongoDB reaps the document at this time. Razorpay orders are not
    // payable indefinitely; 24h comfortably covers any legitimate flow while
    // keeping the collection self-cleaning.
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
}, { timestamps: true });

// TTL index — expireAfterSeconds 0 means "delete when expiresAt passes".
pendingCheckoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingCheckout', pendingCheckoutSchema);
