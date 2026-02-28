// ============================================
// OZOBATH - Shipment Model
// ============================================
const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: String,
  location: String,
  timestamp: { type: Date, default: Date.now },
  description: String,
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  shiprocketOrderId: String,
  shipmentId: String,
  awbCode: String,
  courierName: String,
  courierCompanyId: Number,
  trackingUrl: String,
  status: {
    type: String,
    enum: ['pending', 'pickup_scheduled', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'rto_initiated', 'rto_delivered', 'cancelled', 'lost'],
    default: 'pending',
  },
  statusHistory: [statusHistorySchema],
  estimatedDelivery: Date,
  deliveredAt: Date,
  pickupAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  weight: { type: Number, default: 0.5 },
  dimensions: {
    length: { type: Number, default: 10 },
    breadth: { type: Number, default: 10 },
    height: { type: Number, default: 10 },
  },
  shippingCharges: { type: Number, default: 0 },
  labelUrl: String,
  manifestUrl: String,
  invoiceUrl: String,
}, {
  timestamps: true,
});

shipmentSchema.index({ order: 1 });
shipmentSchema.index({ awbCode: 1 });
shipmentSchema.index({ status: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
