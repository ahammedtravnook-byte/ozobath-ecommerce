// ============================================
// OZOBATH - Service Request Model
// ============================================
const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  orderNumber: String,
  productName: String,
  issueType: {
    type: String,
    enum: ['installation', 'repair', 'replacement', 'warranty', 'general', 'other'],
    default: 'general',
  },
  description: { type: String, required: true },
  images: [{ url: String, publicId: String }],
  preferredDate: Date,
  address: String,
  city: String,
  status: {
    type: String,
    enum: ['new', 'assigned', 'in-progress', 'resolved', 'closed'],
    default: 'new',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolution: String,
  resolvedAt: Date,
}, {
  timestamps: true,
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
