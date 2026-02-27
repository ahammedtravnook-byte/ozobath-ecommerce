// ============================================
// OZOBATH - Site Visit Booking Model
// ============================================
const mongoose = require('mongoose');

const siteVisitBookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  preferredDate: { type: Date, required: true },
  preferredTime: String,
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: String,
  pincode: String,
  notes: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visitFee: { type: Number, default: 59 },
  isPaid: { type: Boolean, default: false },
  paymentId: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('SiteVisitBooking', siteVisitBookingSchema);
