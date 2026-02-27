// ============================================
// OZOBATH - Experience Centre Model
// ============================================
const mongoose = require('mongoose');

const experienceCentreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  phone: String,
  email: String,
  googleMapsUrl: String,
  googleMapsEmbedUrl: String,
  images: [{ url: String, publicId: String, alt: String }],
  timings: { type: String, default: '10:30 AM - 7:30 PM' },
  closedOn: String,
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ExperienceCentre', experienceCentreSchema);
