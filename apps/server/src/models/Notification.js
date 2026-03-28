// ============================================
// OZOBATH - Notification Model
// ============================================
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['order_placed', 'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled',
           'payment_success', 'payment_failed', 'coupon_applied', 'low_stock', 'review_approved',
           'welcome', 'first_order_discount'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed }, // extra payload (orderId, etc)
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, {
  timestamps: true,
});

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
