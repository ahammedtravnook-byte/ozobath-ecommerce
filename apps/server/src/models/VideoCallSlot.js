// ============================================
// OZOBATH - Video Call Slot Model (Shop Live)
// ============================================
const mongoose = require('mongoose');

const videoCallSlotSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  booking: {
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    message: String,
    productsInterested: [String],
  },

  meetingLink: String,
  status: {
    type: String,
    enum: ['available', 'booked', 'completed', 'cancelled', 'no-show'],
    default: 'available',
  },
  notes: String,
  conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

videoCallSlotSchema.index({ date: 1, isBooked: 1 });

module.exports = mongoose.model('VideoCallSlot', videoCallSlotSchema);
