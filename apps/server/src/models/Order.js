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

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `OZO-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });

// Idempotency guard: one order per Razorpay payment, enforced by the database.
// Without this, replaying a valid /payment/confirm payload — or a webhook and
// the browser handler both landing — creates duplicate orders, double-decrements
// stock and double-burns coupon usage. `sparse` keeps COD orders (which have no
// razorpayOrderId) exempt; otherwise the second COD order would collide on null.
orderSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
