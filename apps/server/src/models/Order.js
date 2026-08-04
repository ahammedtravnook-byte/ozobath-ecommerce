// ============================================
// OZOBATH - Order Model
// ============================================
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  items: [orderItemSchema],

  shippingAddress: {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
  },

  subtotal: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  // The value the tax was computed on, and the treatment used. Recorded per
  // order so a config change never retroactively reinterprets past invoices.
  taxableValue: { type: Number },
  taxMode: { type: String, enum: ['inclusive', 'exclusive'] },
  taxRate: { type: Number },
  total: { type: Number, required: true },

  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },

  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod'],
    default: 'razorpay',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },

  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  // Refund ledger. `paymentStatus: 'refunded'` is a single boolean-ish flag
  // and cannot express a partial refund, so repeated refund calls were
  // invisible here. Each gateway refund gets a row; `refundedTotal` is the
  // running sum that caps the next one.
  refunds: [{
    refundId: String,                    // Razorpay refund id
    amount: { type: Number, required: true },   // rupees
    status: String,                      // Razorpay status at creation
    reason: String,
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  refundedTotal: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
  },

  trackingNumber: String,
  trackingUrl: String,
  notes: String,

  statusHistory: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],

  estimatedDelivery: Date,
  deliveredAt: Date,
}, {
  timestamps: true,
});

// Auto-generate order number from an atomic counter. `countDocuments() + 1`
// raced under concurrent checkout and reused numbers after a deletion.
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    try {
      const { nextSequence } = require('./Counter');
      // `this.$session()` is the session this document is being saved in, if
      // any. Passing it keeps the counter increment inside the transaction,
      // so a rollback also rolls back the number rather than burning it.
      const seq = await nextSequence('order', this.$session());
      this.orderNumber = `OZO-${String(seq).padStart(6, '0')}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// NOTE: the unique:true on the field above already creates this index;
// declaring it again produced a duplicate-index warning at boot.
orderSchema.index({ user: 1 });

// Idempotency guard: one order per Razorpay payment, enforced by the database.
// Without this, replaying a valid /payment/confirm payload — or a webhook and
// the browser handler both landing — creates duplicate orders, double-decrements
// stock and double-burns coupon usage. `sparse` keeps COD orders (which have no
// razorpayOrderId) exempt; otherwise the second COD order would collide on null.
orderSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// "My orders", always filtered by user and sorted newest-first. The separate
// `user` and `createdAt` indexes cannot serve that in one pass.
orderSchema.index({ user: 1, createdAt: -1 });

// Admin listing filtered by status, sorted newest-first.
orderSchema.index({ status: 1, createdAt: -1 });

// Revenue aggregations and the coupon analytics grouping.
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ coupon: 1, paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
