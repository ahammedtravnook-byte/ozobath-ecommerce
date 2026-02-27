// ============================================
// OZOBATH - Admin Activity Log Model
// ============================================
const mongoose = require('mongoose');

const adminActivityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  resource: String,
  resourceId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
}, {
  timestamps: true,
});

adminActivityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AdminActivityLog', adminActivityLogSchema);
