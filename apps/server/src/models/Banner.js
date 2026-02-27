// ============================================
// OZOBATH - Banner Model
// ============================================
const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  description: String,
  image: {
    url: { type: String, required: true },
    publicId: String,
    alt: String,
  },
  mobileImage: {
    url: String,
    publicId: String,
  },
  link: String,
  buttonText: String,
  page: {
    type: String,
    enum: ['home', 'shop', 'about', 'contact', 'category'],
    default: 'home',
  },
  position: {
    type: String,
    enum: ['hero', 'promo', 'category', 'sidebar'],
    default: 'hero',
  },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  startDate: Date,
  endDate: Date,
  textColor: { type: String, default: '#ffffff' },
  overlayColor: String,
}, {
  timestamps: true,
});

bannerSchema.index({ page: 1, position: 1, isActive: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
