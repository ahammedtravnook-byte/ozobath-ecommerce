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
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && new Date() >= coupon.startDate && new Date() <= coupon.endDate) {
      if (subtotal >= coupon.minOrderAmount) {
        discount = coupon.type === 'percentage'
          ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
          : coupon.value;
        couponId = coupon._id;
        coupon.usedCount += 1;
        coupon.usedBy.push(req.user._id);
        await coupon.save();
      }
    }
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
  sendResponse(res, 200, order, 'Order status updated');
});

module.exports = { createOrder, getMyOrders, getMyOrderById, getAllOrders, getOrderById, updateOrderStatus };
