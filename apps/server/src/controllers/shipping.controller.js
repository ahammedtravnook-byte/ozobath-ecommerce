// ============================================
// OZOBATH - Shipping Controller (Shiprocket)
// ============================================
const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const shiprocket = require('../config/shiprocket.config');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

// ─── Create Shipment ─────────────────────────────
const createShipment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate('user', 'name email phone')
    .populate('items.product', 'name sku weight');

  if (!order) throw new ApiError(404, 'Order not found');
  if (order.orderStatus === 'cancelled') throw new ApiError(400, 'Cannot ship a cancelled order');

  // Check if shipment already exists
  const existingShipment = await Shipment.findOne({ order: order._id });
  if (existingShipment) throw new ApiError(400, 'Shipment already exists for this order');

  const shippingAddress = order.shippingAddress;

  // Calculate total weight
  const totalWeight = order.items.reduce((sum, item) => {
    const w = item.product?.weight || 0.5;
    return sum + (w * item.quantity);
  }, 0);

  // Create Shiprocket order
  const shiprocketOrder = await shiprocket.createOrder({
    order_id: order.orderNumber || order._id.toString(),
    order_date: new Date(order.createdAt).toISOString().split('T')[0],
    pickup_location: 'Primary',
    billing_customer_name: shippingAddress.fullName || order.user?.name || 'Customer',
    billing_last_name: '',
    billing_address: shippingAddress.line1,
    billing_address_2: shippingAddress.line2 || '',
    billing_city: shippingAddress.city,
    billing_pincode: shippingAddress.pincode,
    billing_state: shippingAddress.state,
    billing_country: 'India',
    billing_email: order.user?.email || '',
    billing_phone: shippingAddress.phone || order.user?.phone || '',
    shipping_is_billing: true,
    order_items: order.items.map(item => ({
      name: item.product?.name || item.name || 'Product',
      sku: item.product?.sku || `SKU-${item.product?._id}`,
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
    })),
    payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    sub_total: order.totalAmount,
    length: 30,
    breadth: 25,
    height: 15,
    weight: Math.max(totalWeight, 0.5),
  });

  if (!shiprocketOrder.order_id) {
    throw new ApiError(500, 'Failed to create Shiprocket order: ' + (shiprocketOrder.message || 'Unknown error'));
  }

  // Save shipment to database
  const shipment = await Shipment.create({
    order: order._id,
    shiprocketOrderId: shiprocketOrder.order_id,
    shipmentId: shiprocketOrder.shipment_id,
    status: 'pending',
    weight: Math.max(totalWeight, 0.5),
    dimensions: { length: 30, breadth: 25, height: 15 },
    statusHistory: [{ status: 'pending', description: 'Shipment created on Shiprocket' }],
  });

  // Update order status
  order.orderStatus = 'processing';
  await order.save();

  sendResponse(res, 201, shipment, 'Shipment created successfully');
});

// ─── Get Shipping Rates ──────────────────────────
const getShippingRates = asyncHandler(async (req, res) => {
  const { pickupPincode, deliveryPincode, weight, cod } = req.query;

  if (!deliveryPincode) throw new ApiError(400, 'Delivery pincode is required');

  const pickup = pickupPincode || env.PICKUP_PINCODE || '560001';
  const w = parseFloat(weight) || 0.5;

  const rates = await shiprocket.getAvailableCouriers(pickup, deliveryPincode, w, cod === 'true');

  const formattedRates = (rates.data?.available_courier_companies || []).map(c => ({
    courierId: c.courier_company_id,
    courierName: c.courier_name,
    rate: c.rate,
    estimatedDays: c.estimated_delivery_days,
    etd: c.etd,
    cod: c.cod,
    rating: c.rating,
  }));

  sendResponse(res, 200, formattedRates, 'Shipping rates fetched');
});

// ─── Track Shipment ──────────────────────────────
const trackShipment = asyncHandler(async (req, res) => {
  const shipment = await Shipment.findOne({ order: req.params.orderId });
  if (!shipment) throw new ApiError(404, 'Shipment not found');

  let trackingData = null;

  if (shipment.awbCode) {
    trackingData = await shiprocket.trackByAWB(shipment.awbCode);
  } else if (shipment.shipmentId) {
    trackingData = await shiprocket.trackByShipmentId(shipment.shipmentId);
  }

  sendResponse(res, 200, {
    shipment,
    tracking: trackingData?.tracking_data || null,
  }, 'Tracking info fetched');
});

// ─── Assign Courier & Generate AWB ───────────────
const assignCourier = asyncHandler(async (req, res) => {
  const { courierCompanyId } = req.body;
  const shipment = await Shipment.findOne({ order: req.params.orderId });
  if (!shipment) throw new ApiError(404, 'Shipment not found');

  const awbResult = await shiprocket.generateAWB(shipment.shipmentId, courierCompanyId);

  if (awbResult.response?.data?.awb_code) {
    shipment.awbCode = awbResult.response.data.awb_code;
    shipment.courierName = awbResult.response.data.courier_name;
    shipment.courierCompanyId = courierCompanyId;
    shipment.status = 'pickup_scheduled';
    shipment.statusHistory.push({
      status: 'pickup_scheduled',
      description: `AWB assigned: ${shipment.awbCode}, Courier: ${shipment.courierName}`,
    });
    await shipment.save();

    // Generate label
    await shiprocket.generateLabel(shipment.shipmentId);
    // Schedule pickup
    await shiprocket.schedulePickup(shipment.shipmentId);
  }

  sendResponse(res, 200, shipment, 'Courier assigned and pickup scheduled');
});

// ─── Cancel Shipment ─────────────────────────────
const cancelShipment = asyncHandler(async (req, res) => {
  const shipment = await Shipment.findOne({ order: req.params.orderId });
  if (!shipment) throw new ApiError(404, 'Shipment not found');

  if (['delivered', 'rto_delivered'].includes(shipment.status)) {
    throw new ApiError(400, 'Cannot cancel a delivered shipment');
  }

  await shiprocket.cancelOrder([shipment.shiprocketOrderId]);

  shipment.status = 'cancelled';
  shipment.statusHistory.push({ status: 'cancelled', description: 'Shipment cancelled by admin' });
  await shipment.save();

  sendResponse(res, 200, shipment, 'Shipment cancelled');
});

// ─── Shiprocket Webhook ──────────────────────────
const handleWebhook = asyncHandler(async (req, res) => {
  const { awb, current_status, current_timestamp, shipment_id, etd } = req.body;

  const shipment = await Shipment.findOne({
    $or: [{ awbCode: awb }, { shipmentId: String(shipment_id) }],
  });

  if (!shipment) {
    return res.status(200).json({ success: true, message: 'Shipment not found, ignored' });
  }

  // Map Shiprocket status to our status
  const statusMap = {
    '1': 'pickup_scheduled', '2': 'pickup_scheduled',
    '3': 'picked_up', '4': 'picked_up',
    '5': 'in_transit', '6': 'in_transit', '17': 'in_transit', '18': 'in_transit',
    '7': 'delivered', '8': 'cancelled',
    '9': 'rto_initiated', '10': 'rto_initiated',
    '14': 'rto_delivered', '15': 'rto_delivered',
    '12': 'lost', '16': 'out_for_delivery',
  };

  const mappedStatus = statusMap[String(current_status)] || shipment.status;
  shipment.status = mappedStatus;
  shipment.statusHistory.push({
    status: mappedStatus,
    description: `Status update from Shiprocket`,
    timestamp: current_timestamp ? new Date(current_timestamp) : new Date(),
  });

  if (etd) shipment.estimatedDelivery = new Date(etd);
  if (mappedStatus === 'delivered') shipment.deliveredAt = new Date();

  await shipment.save();

  // Update order status accordingly
  const Order = require('../models/Order');
  const orderStatusMap = {
    'picked_up': 'shipped', 'in_transit': 'shipped',
    'out_for_delivery': 'shipped', 'delivered': 'delivered',
    'cancelled': 'cancelled', 'rto_initiated': 'processing',
  };
  if (orderStatusMap[mappedStatus]) {
    await Order.findByIdAndUpdate(shipment.order, { orderStatus: orderStatusMap[mappedStatus] });
  }

  res.status(200).json({ success: true, message: 'Webhook processed' });
});

// ─── Get all shipments for admin ─────────────────
const getAllShipments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const shipments = await Shipment.find(filter)
    .populate('order', 'orderNumber totalAmount orderStatus user')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const total = await Shipment.countDocuments(filter);

  sendResponse(res, 200, { shipments, total, page: parseInt(page), pages: Math.ceil(total / limit) }, 'Shipments fetched');
});

module.exports = {
  createShipment, getShippingRates, trackShipment, assignCourier,
  cancelShipment, handleWebhook, getAllShipments,
};
