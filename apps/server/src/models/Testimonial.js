// ============================================
// OZOBATH - Testimonial Model
// ============================================
const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: String,
  company: String,
  avatar: { url: String, publicId: String },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  comment: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
