// ============================================
// OZOBATH - Coupon Model
// ============================================
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: String,
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  value: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: Number,
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, {
  timestamps: true,
});

couponSchema.index({ code: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
