// ============================================
// OZOBATH - Admin Notification Model
// System-level notifications visible to all admins
// ============================================
const mongoose = require('mongoose');

const adminNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['new_order', 'new_review', 'low_stock', 'new_enquiry', 'new_service_request', 'new_booking', 'payment_failed'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },              // admin-side route, e.g. "/orders/abc123"
  data: { type: mongoose.Schema.Types.Mixed },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // admin user IDs who read it
}, {
  timestamps: true,
});

adminNotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminNotification', adminNotificationSchema);
