// ============================================
// OZOBATH - Order Controller
// ============================================
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('./notification.controller');

// POST /orders — Create order from cart
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'razorpay', couponCode, notes } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Cart is empty.');

  let subtotal = 0;
  const items = cart.items.map((item) => {
    const price = item.product.price;
    subtotal += price * item.quantity;
    return {
      product: item.product._id, name: item.product.name,
      image: item.product.images?.[0]?.url, price, quantity: item.quantity,
      variant: item.variant,
    };
  });

  let discount = 0;
  let couponId = null;
  if (couponCode) {
    // Atomic coupon usage increment — prevents race condition
    const coupon = await Coupon.findOneAndUpdate(
      {
        code: couponCode.toUpperCase(),
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
      },
      { $inc: { usedCount: 1 }, $push: { usedBy: req.user._id } },
      { new: false }
    );

    if (!coupon) throw new ApiError(400, 'Invalid, expired, or usage-limit-reached coupon code.');
    if (subtotal < coupon.minOrderAmount) throw new ApiError(400, `Minimum order amount is ₹${coupon.minOrderAmount}.`);

    const userUsage = coupon.usedBy.filter((id) => id.toString() === req.user._id.toString()).length;
    if (coupon.perUserLimit && userUsage >= coupon.perUserLimit) {
      // Rollback the increment we just did
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: -1 }, $pull: { usedBy: req.user._id } });
      throw new ApiError(400, 'You have already used this coupon the maximum number of times.');
    }

    discount = coupon.type === 'percentage'
      ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
      : coupon.value;
    discount = Math.round(discount);
    couponId = coupon._id;
  }

  const shippingCost = subtotal >= 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shippingCost + tax - discount;

  const order = await Order.create({
    user: req.user._id, items, shippingAddress, subtotal,
    shippingCost, discount, tax, total, coupon: couponId,
    paymentMethod, notes,
    statusHistory: [{ status: 'pending', date: new Date(), note: 'Order placed' }],
  });

  // Update product stock and sales
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, salesCount: item.quantity },
    });
  }

  // Clear cart
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalAmount: 0 });

  // Send notification
  await createNotification(
    req.user._id,
    'order_placed',
    'Order Placed Successfully',
    `Your order #${order.orderNumber} for ₹${total.toLocaleString('en-IN')} has been placed.`,
    { orderId: order._id, orderNumber: order.orderNumber }
  );

  sendResponse(res, 201, order, 'Order placed successfully');
});

// GET /orders/my-orders
const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id }).sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
    Order.countDocuments({ user: req.user._id }),
  ]);

  sendResponse(res, 200, { orders, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } }, 'Orders fetched');
});

// GET /orders/my-orders/:id
const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate('items.product', 'name slug images');
  if (!order) throw new ApiError(404, 'Order not found.');
  sendResponse(res, 200, order, 'Order fetched');
});

// POST /orders/:id/cancel — Customer can cancel within 1 hour
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found.');

  if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
    throw new ApiError(400, `Order cannot be cancelled — current status is "${order.status}".`);
  }

  const hoursSinceOrder = (Date.now() - new Date(order.createdAt)) / 3600000;
  if (order.status !== 'pending' && hoursSinceOrder > 1) {
    throw new ApiError(400, 'Order can only be cancelled within 1 hour of placing it or while in pending status.');
  }

  const { reason = 'Cancelled by customer' } = req.body;

  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', date: new Date(), note: reason });
  await order.save();

  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, salesCount: -item.quantity },
    });
  }

  // Rollback coupon usage if coupon was applied
  if (order.coupon) {
    await Coupon.findByIdAndUpdate(order.coupon, {
      $inc: { usedCount: -1 },
      $pull: { usedBy: req.user._id },
    });
  }

  // Notify user
  await createNotification(
    req.user._id,
    'order_cancelled',
    'Order Cancelled',
    `Your order #${order.orderNumber} has been cancelled. If you paid online, a refund will be processed in 5-7 business days.`,
    { orderId: order._id, orderNumber: order.orderNumber }
  );

  sendResponse(res, 200, order, 'Order cancelled successfully');
});

// GET /orders — Admin: all orders
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.$or = [
    { orderNumber: { $regex: search, $options: 'i' } },
  ];

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email phone').sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
    Order.countDocuments(filter),
  ]);

  sendResponse(res, 200, { orders, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } }, 'All orders fetched');
});

// GET /orders/:id — Admin
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone').populate('items.product', 'name slug images');
  if (!order) throw new ApiError(404, 'Order not found.');
  sendResponse(res, 200, order, 'Order fetched');
});

// PUT /orders/:id/status — Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber, trackingUrl } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (trackingUrl) order.trackingUrl = trackingUrl;
  if (status === 'delivered') order.deliveredAt = new Date();
  if (status === 'confirmed') order.paymentStatus = 'paid';

  order.statusHistory.push({
    status, date: new Date(), note: note || `Status updated to ${status}`,
    updatedBy: req.user._id,
  });

  await order.save();

  // Notify customer
  const notifMap = {
    confirmed: { title: 'Order Confirmed', msg: `Your order #${order.orderNumber} has been confirmed and is being prepared.` },
    shipped: { title: 'Order Shipped', msg: `Your order #${order.orderNumber} is on its way! Track: ${trackingNumber || 'Available soon'}` },
    delivered: { title: 'Order Delivered', msg: `Your order #${order.orderNumber} has been delivered. Enjoy your purchase!` },
    cancelled: { title: 'Order Cancelled', msg: `Your order #${order.orderNumber} has been cancelled.` },
  };
  if (notifMap[status]) {
    await createNotification(order.user, `order_${status}`, notifMap[status].title, notifMap[status].msg, { orderId: order._id, orderNumber: order.orderNumber });
  }

  sendResponse(res, 200, order, 'Order status updated');
});

// GET /orders/export — Admin: export orders as CSV
const exportOrders = asyncHandler(async (req, res) => {
  const { status, from, to } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const orders = await Order.find(filter)
    .populate('user', 'name email phone')
    .sort('-createdAt')
    .lean();

  const rows = [
    ['Order Number', 'Date', 'Customer', 'Email', 'Phone', 'Status', 'Payment', 'Subtotal', 'Shipping', 'Tax', 'Discount', 'Total', 'Items'].join(','),
    ...orders.map(o => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString('en-IN'),
      `"${o.user?.name || ''}"`,
      o.user?.email || '',
      o.user?.phone || '',
      o.status,
      o.paymentMethod,
      o.subtotal,
      o.shippingCost,
      o.tax,
      o.discount,
      o.total,
      o.items?.length || 0,
    ].join(',')),
  ];

  const csv = rows.join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
  res.send(csv);
});

module.exports = { createOrder, getMyOrders, getMyOrderById, cancelOrder, getAllOrders, getOrderById, updateOrderStatus, exportOrders };
