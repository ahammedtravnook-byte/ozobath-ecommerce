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
const { calculateTotals } = require('../utils/calculateTotals');
const { decrementStock, restoreStock } = require('../utils/stock');
const { renderInvoicePdf } = require('../services/invoicePdf.service');
const { canTransition, explainTransition } = require('../utils/orderStateMachine');
const { paginate } = require('../utils/pagination');
const { escapeRegex, cleanText } = require('../utils/sanitize');
const { withTransaction } = require('../utils/withTransaction');
const env = require('../config/env');
const { createNotification } = require('./notification.controller');
const { logActivity } = require('./activityLog.controller');
const { createAdminNotification } = require('./adminNotification.controller');

// POST /orders — Create order from cart
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'razorpay', couponCode, notes } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Cart is empty.');

  // Price the cart — shared calculator, identical to the Razorpay paths
  const preCoupon = calculateTotals(cart.items);
  const subtotal = preCoupon.subtotal;

  const items = preCoupon.activeItems.map((item) => ({
    product: item.product._id, name: item.product.name,
    image: item.product.images?.[0]?.url, price: item.product.price,
    quantity: item.quantity, variant: item.variant, hsn: item.product.hsn,
  }));

  if (items.length === 0) throw new ApiError(400, 'No active products in cart.');

  // Coupon claim, order create, stock decrement and cart clear are one unit:
  // a crash partway through previously burned a coupon with no order, or
  // created an order whose stock was never decremented.
  const order = await withTransaction(async (session) => {
    const opts = session ? { session } : {};

    let claimedCoupon = null;
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
        { new: false, ...opts }
      );

      if (!coupon) throw new ApiError(400, 'Invalid, expired, or usage-limit-reached coupon code.');
      if (subtotal < coupon.minOrderAmount) throw new ApiError(400, `Minimum order amount is ₹${coupon.minOrderAmount}.`);

      const userUsage = coupon.usedBy.filter((id) => id.toString() === req.user._id.toString()).length;
      if (coupon.perUserLimit && userUsage >= coupon.perUserLimit) {
        // Inside a transaction the throw rolls the increment back; the
        // explicit rollback covers the no-transaction fallback path.
        if (!session) {
          await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: -1 }, $pull: { usedBy: req.user._id } });
        }
        throw new ApiError(400, 'You have already used this coupon the maximum number of times.');
      }

      claimedCoupon = coupon;
      couponId = coupon._id;
    }

    const { shippingCost, tax, discount, total, taxableValue } = calculateTotals(cart.items, claimedCoupon);

    const created = await Order.create([{
      user: req.user._id, items, shippingAddress, subtotal,
      shippingCost, discount, tax, total, coupon: couponId,
      taxableValue, taxMode: env.TAX_MODE, taxRate: env.TAX_RATE,
      paymentMethod, notes,
      statusHistory: [{ status: 'pending', date: new Date(), note: 'Order placed' }],
    }], opts);

    const newOrder = created[0];

    // Update product stock and sales
    for (const item of items) {
      await decrementStock(item.product, item.quantity, session);
    }

    // Clear cart (COD path — Razorpay path clears cart in payment.controller.js)
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalAmount: 0 }, opts);

    return newOrder;
  });

  const total = order.total;

  // Notify customer
  await createNotification(
    req.user._id,
    'order_placed',
    'Order Placed Successfully',
    `Your order #${order.orderNumber} for ₹${total.toLocaleString('en-IN')} has been placed.`,
    { orderId: order._id, orderNumber: order.orderNumber }
  );

  // Notify admins
  await createAdminNotification(
    'new_order',
    `New Order #${order.orderNumber}`,
    `₹${total.toLocaleString('en-IN')} — ${items.length} item(s) from ${req.user.name || req.user.email}`,
    `/orders/${order._id}`,
    { orderId: order._id, orderNumber: order.orderNumber, total }
  );

  // Check for low stock after order.
  // One query for all items rather than one per item.
  const lowStock = await Product.find({
    _id: { $in: items.map((i) => i.product) },
    stock: { $lte: 5 },
  }).select('name stock').lean();

  for (const p of lowStock) {
    await createAdminNotification(
      'low_stock',
      'Low Stock Alert',
      `${p.name} has only ${p.stock} unit(s) remaining`,
      `/inventory`,
      { productId: p._id, stock: p.stock }
    );
  }

  sendResponse(res, 201, order, 'Order placed successfully');
});

// GET /orders/my-orders
const getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 10 });

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id }).sort('-createdAt').skip(skip).limit(limit).lean(),
    Order.countDocuments({ user: req.user._id }),
  ]);

  sendResponse(res, 200, { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }, 'Orders fetched');
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

  // Same transition table the admin path uses, so "can this be cancelled?"
  // has one answer rather than two that can drift apart.
  if (!canTransition(order.status, 'cancelled')) {
    throw new ApiError(400, `Order cannot be cancelled — current status is "${order.status}".`);
  }

  const hoursSinceOrder = (Date.now() - new Date(order.createdAt)) / 3600000;
  if (order.status !== 'pending' && hoursSinceOrder > 1) {
    throw new ApiError(400, 'Order can only be cancelled within 1 hour of placing it or while in pending status.');
  }

  const { reason = 'Cancelled by customer' } = req.body;

  // Cancel, restore stock and release the coupon as one unit — otherwise a
  // crash could cancel the order without returning the stock, or return the
  // stock without releasing the coupon.
  await withTransaction(async (session) => {
    const opts = session ? { session } : {};

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', date: new Date(), note: reason });
    await order.save(opts);

    // Restore product stock
    for (const item of order.items) {
      await restoreStock(item.product, item.quantity, session);
    }

    // Rollback coupon usage if coupon was applied
    if (order.coupon) {
      await Coupon.findByIdAndUpdate(
        order.coupon,
        { $inc: { usedCount: -1 }, $pull: { usedBy: req.user._id } },
        opts
      );
    }
  });

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
  const { status, search } = req.query;
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (status) filter.status = String(status);
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: escapeRegex(String(search).slice(0, 100)), $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email phone').sort('-createdAt').skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  sendResponse(res, 200, { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }, 'All orders fetched');
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

  // Enforce the state machine. Previously any status could be set from any
  // state, so an unpaid order could be shipped and a refunded order could be
  // walked back to `delivered`.
  if (!canTransition(order.status, status)) {
    throw new ApiError(400, explainTransition(order.status, status));
  }

  // A prepaid order must not enter fulfilment unless the money actually
  // arrived. `confirmed` used to SET paymentStatus='paid'; it now REQUIRES it,
  // which is the difference between recording a payment and inventing one.
  if (status === 'confirmed' && order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid') {
    throw new ApiError(
      400,
      'Cannot confirm a prepaid order that has not been paid. Payment is recorded by the payment flow, not by a status change.'
    );
  }

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (trackingUrl) order.trackingUrl = trackingUrl;
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    // Cash collected on delivery. Restricted to COD orders that are still
    // awaiting payment — it must never overwrite a `refunded` or `failed`
    // state, which the previous `!== 'paid'` check allowed.
    if (order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'paid';
      order.statusHistory.push({
        status: 'payment_collected',
        date: new Date(),
        note: 'COD cash collected on delivery',
        updatedBy: req.user._id,
      });
    }
  }

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

  await logActivity(req, `update_order_status_to_${status}`, 'Order', order._id, { orderNumber: order.orderNumber, newStatus: status, note });
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

  // Bounded. This previously had no limit at all: one request materialised
  // every order plus populated user PII in memory.
  const MAX_EXPORT_ROWS = 5000;
  const orders = await Order.find(filter)
    .populate('user', 'name email phone')
    .sort('-createdAt')
    .limit(MAX_EXPORT_ROWS)
    .lean();

  // CSV injection: a cell beginning with = + - @ is evaluated as a formula
  // when the file is opened in Excel or Sheets. A customer registering as
  // `=HYPERLINK("http://evil","click")` would execute in an admin's
  // spreadsheet. Prefix with a quote to neutralise, then quote-escape.
  const csvCell = (value) => {
    if (value === null || value === undefined) return '';
    let s = String(value);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };

  const rows = [
    ['Order Number', 'Date', 'Customer', 'Email', 'Phone', 'Status', 'Payment', 'Subtotal', 'Shipping', 'Tax', 'Discount', 'Total', 'Items'].join(','),
    ...orders.map(o => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString('en-IN'),
      o.user?.name || '',
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
    ].map(csvCell).join(',')),
  ];

  const csv = rows.join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
  res.send(csv);
});

// ─── Invoice PDF ─────────────────────────────────
// Rendered on demand rather than stored. The invoice sub-document is frozen
// at issue time, so re-rendering always reproduces the same document — there
// is nothing to gain from keeping a copy, and a stored file is one more
// thing to keep in sync and to leak.
//
// Ownership is enforced by querying on { _id, user } rather than fetching
// and comparing: an admin route would use a different handler, and a
// customer must never be able to read another customer's invoice by id.
const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
    .populate('user', 'name email')
    .lean();

  if (!order) throw new ApiError(404, 'Order not found');

  if (!order.invoice?.number) {
    throw new ApiError(
      404,
      'No tax invoice has been issued for this order yet.'
    );
  }

  const pdf = await renderInvoicePdf(order);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${order.invoice.number.replace(/\//g, '-')}.pdf"`
  );
  res.send(pdf);
});

module.exports = { createOrder, getMyOrders, getMyOrderById, cancelOrder, getAllOrders, getOrderById, updateOrderStatus, exportOrders, downloadInvoice };
