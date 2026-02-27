// ============================================
// OZOBATH - B2B Enquiry Model
// ============================================
const mongoose = require('mongoose');

const b2bEnquirySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  city: String,
  state: String,
  businessType: {
    type: String,
    enum: ['dealer', 'builder', 'architect', 'interior-designer', 'other'],
  },
  message: String,
  productsInterested: [String],
  estimatedQuantity: String,
  status: {
    type: String,
    enum: ['new', 'contacted', 'in-progress', 'converted', 'closed'],
    default: 'new',
  },
  notes: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('B2BEnquiry', b2bEnquirySchema);
