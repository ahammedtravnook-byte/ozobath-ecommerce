// ============================================
// OZOBATH - Instagram Reel Model
// ============================================
const mongoose = require('mongoose');

const instagramReelSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  reelUrl: { type: String, required: true, trim: true },
  thumbnailUrl: {
    url: String,
    publicId: String,
  },
  caption: { type: String, trim: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  linkedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
}, {
  timestamps: true,
});

instagramReelSchema.index({ order: 1 });
instagramReelSchema.index({ isActive: 1 });

module.exports = mongoose.model('InstagramReel', instagramReelSchema);
