// ============================================
// OZOBATH - Review, Blog, Coupon, FAQ, Testimonial,
// Wishlist, Newsletter, Enquiry, Service, Booking,
// Payment, Analytics, Admin Controllers
// ============================================
const Review = require('../models/Review');
const Blog = require('../models/Blog');
const Coupon = require('../models/Coupon');
const FAQ = require('../models/FAQ');
const Testimonial = require('../models/Testimonial');
const Wishlist = require('../models/Wishlist');
const Newsletter = require('../models/Newsletter');
const B2BEnquiry = require('../models/B2BEnquiry');
const ServiceRequest = require('../models/ServiceRequest');
const VideoCallSlot = require('../models/VideoCallSlot');
const SiteVisitBooking = require('../models/SiteVisitBooking');
const Partner = require('../models/Partner');
const ExperienceCentre = require('../models/ExperienceCentre');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');
const { createNotification } = require('./notification.controller');
const { createAdminNotification } = require('./adminNotification.controller');

// ─── REVIEW ──────────────────────────────────────
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, isApproved: true })
    .populate('user', 'name avatar').sort('-createdAt').lean();
  sendResponse(res, 200, reviews, 'Reviews fetched');
});

const createReview = asyncHandler(async (req, res) => {
  const { product, rating, title, comment, images } = req.body;

  const existing = await Review.findOne({ product, user: req.user._id });
  if (existing) throw new ApiError(400, 'You already reviewed this product.');

  // Check verified purchase
  const purchasedOrder = await Order.findOne({
    user: req.user._id,
    'items.product': product,
    status: 'delivered',
  });
  const isVerifiedPurchase = !!purchasedOrder;

  const review = await Review.create({
    product, user: req.user._id, rating, title, comment, images, isVerifiedPurchase,
  });

  // Update product avg rating
  const stats = await Review.aggregate([
    { $match: { product: review.product, isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(product, {
      avgRating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  }

  // Notify admins of new review pending approval
  const productDoc = await Product.findById(product).select('name slug').lean();
  await createAdminNotification(
    'new_review',
    'New Review Pending Approval',
    `${req.user.name || 'A customer'} left a ${rating}★ review on "${productDoc?.name || 'a product'}"`,
    `/reviews`,
    { reviewId: review._id, productId: product, rating }
  );

  sendResponse(res, 201, review, 'Review submitted for approval');
});

const getAllReviewsAdmin = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status === 'pending') filter.isApproved = false;
  if (status === 'approved') filter.isApproved = true;

  const reviews = await Review.find(filter)
    .populate('user', 'name email')
    .populate('product', 'name slug')
    .sort('-createdAt').lean();
  sendResponse(res, 200, reviews, 'Reviews fetched');
});

const approveReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved: req.body.isApproved ?? true },
    { new: true }
  );
  if (!review) throw new ApiError(404, 'Review not found.');

  // Recalculate product rating after approval/rejection
  const stats = await Review.aggregate([
    { $match: { product: review.product, isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(review.product, {
    avgRating: stats[0]?.avgRating ? Math.round(stats[0].avgRating * 10) / 10 : 0,
    reviewCount: stats[0]?.count || 0,
  });

  // Notify user if approved
  if (req.body.isApproved) {
    await createNotification(
      review.user,
      'review_approved',
      'Your Review Was Published',
      'Your product review has been approved and is now visible to other customers.',
      { productId: review.product }
    );
  }

  sendResponse(res, 200, review, 'Review updated');
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (review) {
    // Recalculate rating after deletion
    const stats = await Review.aggregate([
      { $match: { product: review.product, isApproved: true } },
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await Product.findByIdAndUpdate(review.product, {
      avgRating: stats[0]?.avgRating ? Math.round(stats[0].avgRating * 10) / 10 : 0,
      reviewCount: stats[0]?.count || 0,
    });
  }
  sendResponse(res, 200, null, 'Review deleted');
});

// Review helpfulness vote
const voteReviewHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { $inc: { helpfulCount: 1 } },
    { new: true }
  );
  if (!review) throw new ApiError(404, 'Review not found.');
  sendResponse(res, 200, { helpfulCount: review.helpfulCount }, 'Vote recorded');
});

// ─── BLOG ────────────────────────────────────────
const getBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, tag } = req.query;
  const filter = { isPublished: true };
  if (category) filter.category = category;
  if (tag) filter.tags = tag;

  const skip = (page - 1) * limit;
  const [blogs, total] = await Promise.all([
    Blog.find(filter).populate('author', 'name avatar').sort('-publishedAt').skip(skip).limit(Number(limit)).lean(),
    Blog.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    blogs,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  }, 'Blogs fetched');
});

const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOneAndUpdate(
    { slug: req.params.slug, isPublished: true },
    { $inc: { views: 1 } },
    { new: true }
  ).populate('author', 'name avatar');
  if (!blog) throw new ApiError(404, 'Blog post not found.');
  sendResponse(res, 200, blog, 'Blog fetched');
});

const createBlog = asyncHandler(async (req, res) => {
  // Ensure slug uniqueness
  let slug = slugify(req.body.title);
  const existingSlug = await Blog.findOne({ slug });
  if (existingSlug) slug = `${slug}-${Date.now()}`;

  req.body.slug = slug;
  req.body.author = req.user._id;
  if (req.body.isPublished) req.body.publishedAt = new Date();

  const blog = await Blog.create(req.body);
  sendResponse(res, 201, blog, 'Blog created');
});

const updateBlog = asyncHandler(async (req, res) => {
  if (req.body.title) {
    let slug = slugify(req.body.title);
    const existingSlug = await Blog.findOne({ slug, _id: { $ne: req.params.id } });
    if (existingSlug) slug = `${slug}-${Date.now()}`;
    req.body.slug = slug;
  }
  if (req.body.isPublished && !req.body.publishedAt) req.body.publishedAt = new Date();

  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!blog) throw new ApiError(404, 'Blog not found.');
  sendResponse(res, 200, blog, 'Blog updated');
});

const deleteBlog = asyncHandler(async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  sendResponse(res, 200, null, 'Blog deleted');
});

const getAllBlogsAdmin = asyncHandler(async (req, res) => {
  const blogs = await Blog.find().populate('author', 'name').sort('-createdAt').lean();
  sendResponse(res, 200, blogs, 'All blogs fetched');
});

// ─── COUPON ──────────────────────────────────────
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) throw new ApiError(404, 'Invalid coupon code.');
  if (new Date() < coupon.startDate || new Date() > coupon.endDate) throw new ApiError(400, 'Coupon has expired.');
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached.');
  if (orderAmount < coupon.minOrderAmount) throw new ApiError(400, `Minimum order amount is ₹${coupon.minOrderAmount}.`);

  const userUsage = coupon.usedBy.filter((id) => id.toString() === req.user._id.toString()).length;
  if (coupon.perUserLimit && userUsage >= coupon.perUserLimit) {
    throw new ApiError(400, 'You have already used this coupon the maximum number of times.');
  }

  let discount = coupon.type === 'percentage'
    ? Math.min((orderAmount * coupon.value) / 100, coupon.maxDiscount || Infinity)
    : coupon.value;

  sendResponse(res, 200, {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount: Math.round(discount),
    description: coupon.description,
  }, 'Coupon valid');
});

// GET /coupons/auto-apply — find best applicable coupon for cart amount
const autoApplyCoupon = asyncHandler(async (req, res) => {
  const { orderAmount } = req.query;
  const amount = Number(orderAmount) || 0;

  if (amount <= 0) return sendResponse(res, 200, null, 'No coupon applicable');

  const now = new Date();
  // Find all active coupons valid for this order amount
  const coupons = await Coupon.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    minOrderAmount: { $lte: amount },
    $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
  }).lean();

  if (coupons.length === 0) return sendResponse(res, 200, null, 'No applicable coupon found');

  // Filter out coupons user has exhausted their per-user limit
  const userOrders = await Order.find({ user: req.user._id, coupon: { $in: coupons.map(c => c._id) } }).select('coupon').lean();
  const userCouponUsage = {};
  userOrders.forEach(o => {
    if (o.coupon) userCouponUsage[o.coupon.toString()] = (userCouponUsage[o.coupon.toString()] || 0) + 1;
  });

  const eligible = coupons.filter(c => {
    if (!c.perUserLimit) return true;
    return (userCouponUsage[c._id.toString()] || 0) < c.perUserLimit;
  });

  if (eligible.length === 0) return sendResponse(res, 200, null, 'No applicable coupon found');

  // Calculate discount for each and pick best
  const withDiscount = eligible.map(c => {
    const disc = c.type === 'percentage'
      ? Math.min((amount * c.value) / 100, c.maxDiscount || Infinity)
      : c.value;
    return { ...c, computedDiscount: Math.round(disc) };
  });

  withDiscount.sort((a, b) => b.computedDiscount - a.computedDiscount);
  const best = withDiscount[0];

  sendResponse(res, 200, {
    code: best.code,
    type: best.type,
    value: best.value,
    discount: best.computedDiscount,
    description: best.description,
  }, 'Best coupon found');
});

const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt').lean();
  sendResponse(res, 200, coupons, 'Coupons fetched');
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  sendResponse(res, 201, coupon, 'Coupon created');
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) throw new ApiError(404, 'Coupon not found.');
  sendResponse(res, 200, coupon, 'Coupon updated');
});

const deleteCoupon = asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  sendResponse(res, 200, null, 'Coupon deleted');
});

// GET /coupons/analytics — coupon usage stats
const getCouponAnalytics = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().lean();

  const analytics = await Promise.all(coupons.map(async (c) => {
    const ordersWithCoupon = await Order.find({ coupon: c._id, paymentStatus: 'paid' })
      .select('total discount').lean();
    const totalRevenue = ordersWithCoupon.reduce((sum, o) => sum + o.total, 0);
    const totalDiscount = ordersWithCoupon.reduce((sum, o) => sum + o.discount, 0);
    const usageRate = c.usageLimit ? Math.round((c.usedCount / c.usageLimit) * 100) : null;
    return {
      ...c,
      totalOrders: ordersWithCoupon.length,
      totalRevenue,
      totalDiscount,
      usageRate,
    };
  }));

  sendResponse(res, 200, analytics, 'Coupon analytics fetched');
});

// ─── FAQ ─────────────────────────────────────────
const getFAQs = asyncHandler(async (req, res) => {
  const faqs = await FAQ.find({ isActive: true }).sort('order').lean();
  sendResponse(res, 200, faqs, 'FAQs fetched');
});

const createFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.create(req.body);
  sendResponse(res, 201, faq, 'FAQ created');
});

const updateFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faq) throw new ApiError(404, 'FAQ not found.');
  sendResponse(res, 200, faq, 'FAQ updated');
});

const deleteFAQ = asyncHandler(async (req, res) => {
  await FAQ.findByIdAndDelete(req.params.id);
  sendResponse(res, 200, null, 'FAQ deleted');
});

// ─── TESTIMONIAL ─────────────────────────────────
const getTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({ isActive: true }).sort('order').lean();
  sendResponse(res, 200, testimonials, 'Testimonials fetched');
});

const createTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.create(req.body);
  sendResponse(res, 201, testimonial, 'Testimonial created');
});

const updateTestimonial = asyncHandler(async (req, res) => {
  const t = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!t) throw new ApiError(404, 'Testimonial not found.');
  sendResponse(res, 200, t, 'Testimonial updated');
});

const deleteTestimonial = asyncHandler(async (req, res) => {
  await Testimonial.findByIdAndDelete(req.params.id);
  sendResponse(res, 200, null, 'Testimonial deleted');
});

// ─── WISHLIST ────────────────────────────────────
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products', 'name slug price images stock');
  if (!wishlist) wishlist = { products: [] };
  sendResponse(res, 200, wishlist, 'Wishlist fetched');
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) wishlist = new Wishlist({ user: req.user._id, products: [] });

  if (!wishlist.products.includes(productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  wishlist = await Wishlist.findById(wishlist._id).populate('products', 'name slug price images stock');
  sendResponse(res, 200, wishlist, 'Added to wishlist');
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: req.params.productId } },
    { new: true }
  ).populate('products', 'name slug price images stock');
  sendResponse(res, 200, wishlist, 'Removed from wishlist');
});

// ─── NEWSLETTER ──────────────────────────────────
const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required.');

  const existing = await Newsletter.findOne({ email });
  if (existing && existing.isActive) return sendResponse(res, 200, null, 'Already subscribed');

  if (existing) {
    existing.isActive = true;
    existing.subscribedAt = new Date();
    await existing.save();
  } else {
    await Newsletter.create({ email });
  }

  sendResponse(res, 201, null, 'Subscribed successfully');
});

const unsubscribe = asyncHandler(async (req, res) => {
  const { email, token } = req.body;
  // Support token-based unsubscribe (from email links) or direct
  const query = token ? { unsubscribeToken: token } : { email };
  await Newsletter.findOneAndUpdate(query, { isActive: false, unsubscribedAt: new Date() });
  sendResponse(res, 200, null, 'Unsubscribed successfully');
});

const getSubscribers = asyncHandler(async (req, res) => {
  const subs = await Newsletter.find({ isActive: true }).sort('-subscribedAt').lean();
  sendResponse(res, 200, subs, 'Subscribers fetched');
});

// ─── B2B ENQUIRY ─────────────────────────────────
const createB2BEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await B2BEnquiry.create(req.body);
  sendResponse(res, 201, enquiry, 'Enquiry submitted');
});

const getB2BEnquiries = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const enquiries = await B2BEnquiry.find(filter).sort('-createdAt').lean();
  sendResponse(res, 200, enquiries, 'Enquiries fetched');
});

const updateB2BEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await B2BEnquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!enquiry) throw new ApiError(404, 'Enquiry not found.');
  sendResponse(res, 200, enquiry, 'Enquiry updated');
});

// ─── SERVICE REQUEST ─────────────────────────────
const createServiceRequest = asyncHandler(async (req, res) => {
  const sr = await ServiceRequest.create(req.body);
  sendResponse(res, 201, sr, 'Service request submitted');
});

const getServiceRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const requests = await ServiceRequest.find(filter).sort('-createdAt').lean();
  sendResponse(res, 200, requests, 'Service requests fetched');
});

const updateServiceRequest = asyncHandler(async (req, res) => {
  const sr = await ServiceRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!sr) throw new ApiError(404, 'Service request not found.');
  sendResponse(res, 200, sr, 'Service request updated');
});

// ─── VIDEO CALL BOOKING ──────────────────────────
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const filter = { isActive: true, isBooked: false };
  if (date) {
    const d = new Date(date);
    filter.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
  } else {
    filter.date = { $gte: new Date() };
  }
  const slots = await VideoCallSlot.find(filter).sort('date startTime').lean();
  sendResponse(res, 200, slots, 'Available slots fetched');
});

const bookVideoCall = asyncHandler(async (req, res) => {
  const { slotId, customerName, customerEmail, customerPhone, message, productsInterested } = req.body;
  const slot = await VideoCallSlot.findById(slotId);
  if (!slot || slot.isBooked) throw new ApiError(400, 'Slot not available.');

  slot.isBooked = true;
  slot.status = 'booked';
  slot.booking = { customerName, customerEmail, customerPhone, message, productsInterested };
  await slot.save();

  sendResponse(res, 200, slot, 'Video call booked successfully');
});

const createVideoCallSlot = asyncHandler(async (req, res) => {
  const slot = await VideoCallSlot.create(req.body);
  sendResponse(res, 201, slot, 'Slot created');
});

const getAllVideoCallBookings = asyncHandler(async (req, res) => {
  const bookings = await VideoCallSlot.find({ isBooked: true }).sort('-date').lean();
  sendResponse(res, 200, bookings, 'Video call bookings fetched');
});

const updateVideoCallSlot = asyncHandler(async (req, res) => {
  const slot = await VideoCallSlot.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!slot) throw new ApiError(404, 'Slot not found.');
  sendResponse(res, 200, slot, 'Slot updated');
});

// ─── SITE VISIT ──────────────────────────────────
const bookSiteVisit = asyncHandler(async (req, res) => {
  const booking = await SiteVisitBooking.create(req.body);
  sendResponse(res, 201, booking, 'Site visit booked');
});

const getSiteVisitBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const bookings = await SiteVisitBooking.find(filter).sort('-createdAt').lean();
  sendResponse(res, 200, bookings, 'Site visit bookings fetched');
});

const updateSiteVisitBooking = asyncHandler(async (req, res) => {
  const booking = await SiteVisitBooking.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!booking) throw new ApiError(404, 'Booking not found.');
  sendResponse(res, 200, booking, 'Booking updated');
});

// ─── EXPERIENCE CENTRE ──────────────────────────
const getExperienceCentres = asyncHandler(async (req, res) => {
  const centres = await ExperienceCentre.find({ isActive: true }).sort('order').lean();
  sendResponse(res, 200, centres, 'Experience centres fetched');
});

const createExperienceCentre = asyncHandler(async (req, res) => {
  const centre = await ExperienceCentre.create(req.body);
  sendResponse(res, 201, centre, 'Experience centre created');
});

const updateExperienceCentre = asyncHandler(async (req, res) => {
  const centre = await ExperienceCentre.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!centre) throw new ApiError(404, 'Experience centre not found.');
  sendResponse(res, 200, centre, 'Experience centre updated');
});

const deleteExperienceCentre = asyncHandler(async (req, res) => {
  await ExperienceCentre.findByIdAndDelete(req.params.id);
  sendResponse(res, 200, null, 'Experience centre deleted');
});

// ─── PARTNER ─────────────────────────────────────
const getPartners = asyncHandler(async (req, res) => {
  const partners = await Partner.find({ isActive: true }).sort('order').lean();
  sendResponse(res, 200, partners, 'Partners fetched');
});

const createPartner = asyncHandler(async (req, res) => {
  const partner = await Partner.create(req.body);
  sendResponse(res, 201, partner, 'Partner created');
});

const updatePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!partner) throw new ApiError(404, 'Partner not found.');
  sendResponse(res, 200, partner, 'Partner updated');
});

const deletePartner = asyncHandler(async (req, res) => {
  await Partner.findByIdAndDelete(req.params.id);
  sendResponse(res, 200, null, 'Partner deleted');
});

// ─── PAYMENT (Razorpay) ─────────────────────────
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const env = require('../config/env');

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, orderId } = req.body;

  const options = {
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: orderId || `rcpt_${Date.now()}`,
  };

  const razorpayOrder = await razorpay.orders.create(options);

  sendResponse(res, 200, {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: env.RAZORPAY_KEY_ID,
  }, 'Razorpay order created');
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest('hex');

  if (expectedSign !== razorpay_signature) {
    throw new ApiError(400, 'Payment verification failed.');
  }

  if (orderId) {
    const order = await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      status: 'confirmed',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      $push: { statusHistory: { status: 'confirmed', date: new Date(), note: 'Payment verified' } },
    }, { new: true });

    if (order) {
      await createNotification(
        order.user,
        'payment_success',
        'Payment Successful',
        `Payment of ₹${order.total?.toLocaleString('en-IN')} for order #${order.orderNumber} was successful.`,
        { orderId: order._id, orderNumber: order.orderNumber }
      );
    }
  }

  sendResponse(res, 200, { verified: true }, 'Payment verified successfully');
});

// ─── ANALYTICS (Dashboard) ──────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const [
    totalOrders, totalRevenue, totalProducts, totalCustomers,
    recentOrders, pendingOrders, topProducts,
    orderStatusCounts, customerGrowth, lowStockProducts,
    pendingReviews, newEnquiries,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Product.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'customer' }),
    Order.find().sort('-createdAt').limit(10).populate('user', 'name email').lean(),
    Order.countDocuments({ status: 'pending' }),
    Product.find({ isActive: true }).sort('-salesCount').limit(10).select('name images price salesCount stock').lean(),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { role: 'customer', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]),
    Product.find({ isActive: true, stock: { $lt: 10 } })
      .select('name stock images sku lowStockThreshold').sort('stock').limit(10).lean(),
    Review.countDocuments({ isApproved: false }),
    B2BEnquiry.countDocuments({ status: 'new' }),
  ]);

  const orderStatusDistribution = {};
  orderStatusCounts.forEach(s => { orderStatusDistribution[s._id] = s.count; });

  sendResponse(res, 200, {
    stats: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalProducts,
      totalCustomers,
      pendingOrders,
      pendingReviews,
      newEnquiries,
    },
    recentOrders,
    topProducts,
    orderStatusDistribution,
    customerGrowth,
    lowStockProducts,
  }, 'Dashboard data fetched');
});

const getSalesReport = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const dateFrom = new Date(Date.now() - days * 86400000);

  const sales = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: dateFrom } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      revenue: { $sum: '$total' },
      orders: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ]);

  sendResponse(res, 200, sales, 'Sales report fetched');
});

const getCustomerAnalytics = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: 'customer' })
    .select('name email phone createdAt').sort('-createdAt').limit(50).lean();
  sendResponse(res, 200, customers, 'Customer analytics fetched');
});

// ─── ADMIN USER MANAGEMENT (SuperAdmin) ──────────
const getAdminUsers = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } })
    .select('name email phone role isActive createdAt createdBy').sort('-createdAt').lean();
  sendResponse(res, 200, admins, 'Admin users fetched');
});

const createAdminUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = 'admin' } = req.body;

  if (!['admin'].includes(role)) throw new ApiError(400, 'Can only create admin accounts.');

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered.');

  const admin = await User.create({
    name, email, phone, password, role,
    isActive: true, emailVerified: true,
    createdBy: req.user._id,
  });

  sendResponse(res, 201, {
    _id: admin._id, name: admin.name, email: admin.email, role: admin.role, phone: admin.phone,
  }, 'Admin account created');
});

const updateAdminUser = asyncHandler(async (req, res) => {
  const { name, phone, isActive } = req.body;
  const admin = await User.findByIdAndUpdate(req.params.id, { name, phone, isActive }, { new: true }).select('name email phone role isActive');
  if (!admin) throw new ApiError(404, 'Admin user not found.');
  sendResponse(res, 200, admin, 'Admin updated');
});

const deleteAdminUser = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.params.id);
  if (!admin) throw new ApiError(404, 'Admin not found.');
  if (admin.role === 'superadmin') throw new ApiError(403, 'Cannot delete super admin.');
  await User.findByIdAndDelete(req.params.id);
  sendResponse(res, 200, null, 'Admin deleted');
});

const toggleAdminStatus = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.params.id);
  if (!admin) throw new ApiError(404, 'Admin not found.');
  if (admin.role === 'superadmin') throw new ApiError(403, 'Cannot deactivate super admin.');
  admin.isActive = !admin.isActive;
  await admin.save();
  sendResponse(res, 200, { isActive: admin.isActive }, `Admin ${admin.isActive ? 'activated' : 'deactivated'}`);
});

module.exports = {
  // Review
  getProductReviews, createReview, getAllReviewsAdmin, approveReview, deleteReview, voteReviewHelpful,
  // Blog
  getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog, getAllBlogsAdmin,
  // Coupon
  validateCoupon, autoApplyCoupon, getCouponAnalytics, getCoupons, createCoupon, updateCoupon, deleteCoupon,
  // FAQ
  getFAQs, createFAQ, updateFAQ, deleteFAQ,
  // Testimonial
  getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  // Wishlist
  getWishlist, addToWishlist, removeFromWishlist,
  // Newsletter
  subscribe, unsubscribe, getSubscribers,
  // B2B Enquiry
  createB2BEnquiry, getB2BEnquiries, updateB2BEnquiry,
  // Service Request
  createServiceRequest, getServiceRequests, updateServiceRequest,
  // Video Call
  getAvailableSlots, bookVideoCall, createVideoCallSlot, getAllVideoCallBookings, updateVideoCallSlot,
  // Site Visit
  bookSiteVisit, getSiteVisitBookings, updateSiteVisitBooking,
  // Experience Centre
  getExperienceCentres, createExperienceCentre, updateExperienceCentre, deleteExperienceCentre,
  // Partner
  getPartners, createPartner, updatePartner, deletePartner,
  // Payment
  createRazorpayOrder, verifyPayment,
  // Analytics
  getDashboard, getSalesReport, getCustomerAnalytics,
  // Admin Users
  getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, toggleAdminStatus,
};
