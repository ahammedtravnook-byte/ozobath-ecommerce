// ============================================
// OZOBATH - Site Visit Booking Model
// ============================================
const mongoose = require('mongoose');

const siteVisitBookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  preferredDate: { type: Date },
  preferredTime: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  message: String,
  numberOfBathrooms: Number,
  productId: { type: String },
  productName: String,
  productImage: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SiteVisitBooking', siteVisitBookingSchema);
