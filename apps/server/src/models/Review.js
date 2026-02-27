// ============================================
// OZOBATH - Review Model
// ============================================
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true },
  comment: { type: String, required: true },
  images: [{
    url: String,
    publicId: String,
  }],
  isApproved: { type: Boolean, default: false },
  isVerifiedPurchase: { type: Boolean, default: false },
  helpfulCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, isApproved: 1 });

module.exports = mongoose.model('Review', reviewSchema);
