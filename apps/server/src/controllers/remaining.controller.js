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
const { cleanText, cleanImages, isSafeUrl } = require('../utils/sanitize');
const { isValidObjectId } = require('mongoose');
const { paginate } = require('../utils/pagination');
const { buildSearchFilter, resolveSort, sortableSet, listEnvelope } = require('../utils/listQuery');
const dashboardService = require('../services/analytics/dashboard.service');
const { logActivity } = require('./activityLog.controller');

// ─── REVIEW ──────────────────────────────────────
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, isApproved: true })
    .populate('user', 'name avatar').sort('-createdAt').lean();
  sendResponse(res, 200, reviews, 'Reviews fetched');
});

const createReview = asyncHandler(async (req, res) => {
  const { product, images } = req.body;

  if (!isValidObjectId(product)) throw new ApiError(400, 'A valid product id is required.');

  // Rating: the model enum catches out-of-range, but a non-numeric value
  // produced a 500 rather than a 400.
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be a whole number between 1 and 5.');
  }

  // Strip HTML server-side. The admin panel renders UNAPPROVED reviews during
  // moderation, so a payload here executes in an admin's browser before
  // anyone decides whether to approve it — and the admin's access token is
  // reachable from JS.
  const title = cleanText(req.body.title, 200);
  const comment = cleanText(req.body.comment, 2000);

  if (!comment) throw new ApiError(400, 'Review comment is required.');

  const cleanedImages = cleanImages(images, 5);

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
    product, user: req.user._id, rating, title, comment,
    images: cleanedImages, isVerifiedPurchase,
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
  // One vote per user, enforced atomically: $addToSet only matches when the
  // user is not already in the array, so a replay is a no-op rather than
  // another increment.
  const review = await Review.findOneAndUpdate(
    { _id: req.params.id, helpfulVoters: { $ne: req.user._id } },
    { $addToSet: { helpfulVoters: req.user._id }, $inc: { helpfulCount: 1 } },
    { new: true }
  );

  if (!review) {
    // Either the review does not exist or this user already voted. Distinguish
    // the two so an honest client gets a useful message.
    const exists = await Review.findById(req.params.id).select('helpfulCount').lean();
    if (!exists) throw new ApiError(404, 'Review not found.');
    return sendResponse(res, 200, { helpfulCount: exists.helpfulCount }, 'You have already voted on this review');
  }

  sendResponse(res, 200, { helpfulCount: review.helpfulCount }, 'Vote recorded');
});

// ─── BLOG ────────────────────────────────────────
const getBlogs = asyncHandler(async (req, res) => {
  const { category, tag } = req.query;
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 10 });

  const filter = { isPublished: true };
  if (category) filter.category = String(category);
  if (tag) filter.tags = String(tag);

  const [blogs, total] = await Promise.all([
    Blog.find(filter).populate('author', 'name avatar').sort('-publishedAt').skip(skip).limit(limit).lean(),
    Blog.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    blogs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
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

// `usedCount` and `usedBy` are the atomic usage counters the checkout path
// maintains. Accepting them from an update let a write reset coupon
// exhaustion — the enforcement of usageLimit depends on them being accurate.
const COUPON_WRITABLE = [
  'code', 'description', 'type', 'value',
  'minOrderAmount', 'maxDiscount',
  'usageLimit', 'perUserLimit',
  'isActive', 'startDate', 'endDate',
  'applicableCategories', 'applicableProducts',
];

const pickCoupon = (body) => {
  const out = {};
  for (const key of COUPON_WRITABLE) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
};

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(pickCoupon(req.body));
  await logActivity(req, 'create_coupon', 'Coupon', coupon._id, { code: coupon.code, type: coupon.type, value: coupon.value });
  sendResponse(res, 201, coupon, 'Coupon created');
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, pickCoupon(req.body), { new: true });
  if (!coupon) throw new ApiError(404, 'Coupon not found.');
  await logActivity(req, 'update_coupon', 'Coupon', coupon._id, { code: coupon.code, fields: Object.keys(pickCoupon(req.body)) });
  sendResponse(res, 200, coupon, 'Coupon updated');
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (coupon) await logActivity(req, 'delete_coupon', 'Coupon', coupon._id, { code: coupon.code });
  sendResponse(res, 200, null, 'Coupon deleted');
});

// GET /coupons/analytics — coupon usage stats
const getCouponAnalytics = asyncHandler(async (req, res) => {
  // Was N+1: one Order.find() per coupon, each pulling every matching order
  // into memory to sum it. With 50 coupons that is 51 round trips and the
  // whole paid-order history in the Node heap. One grouped aggregation does
  // the summing in the database instead.
  const [coupons, totals] = await Promise.all([
    Coupon.find().lean(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', coupon: { $ne: null } } },
      {
        $group: {
          _id: '$coupon',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalDiscount: { $sum: '$discount' },
        },
      },
    ]),
  ]);

  const byCoupon = new Map(totals.map((t) => [String(t._id), t]));

  const analytics = coupons.map((c) => {
    const t = byCoupon.get(String(c._id));
    return {
      ...c,
      totalOrders: t?.totalOrders || 0,
      totalRevenue: t?.totalRevenue || 0,
      totalDiscount: t?.totalDiscount || 0,
      usageRate: c.usageLimit ? Math.round((c.usedCount / c.usageLimit) * 100) : null,
    };
  });

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

  // The `unsubscribeToken` branch queried a field that does not exist on the
  // Newsletter schema, so token unsubscribes silently matched nothing.
  // Until a real token is issued at subscribe time, accept email only —
  // and require an exact string so an operator object cannot match every
  // subscriber at once.
  if (token !== undefined) {
    throw new ApiError(400, 'Token-based unsubscribe is not available. Submit your email address.');
  }

  if (typeof email !== 'string' || !email.trim()) {
    throw new ApiError(400, 'A valid email address is required.');
  }

  await Newsletter.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    { isActive: false, unsubscribedAt: new Date() }
  );

  // Same response whether or not the address was subscribed — otherwise this
  // endpoint confirms which addresses are on the list.
  sendResponse(res, 200, null, 'Unsubscribed successfully');
});

const getSubscribers = asyncHandler(async (req, res) => {
  const subs = await Newsletter.find({ isActive: true }).sort('-subscribedAt').lean();
  sendResponse(res, 200, subs, 'Subscribers fetched');
});

// ─── B2B ENQUIRY ─────────────────────────────────
// Unauthenticated. Allowlist the fields a submitter may set, so they cannot
// pre-set `status` (burying their own enquiry as resolved) or store an
// unbounded document by adding arbitrary schema fields.
const createB2BEnquiry = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const enquiry = await B2BEnquiry.create({
    companyName: cleanText(b.companyName, 200),
    contactPerson: cleanText(b.contactPerson, 120),
    email: cleanText(b.email, 200),
    phone: cleanText(b.phone, 30),
    city: cleanText(b.city, 120),
    state: cleanText(b.state, 120),
    businessType: cleanText(b.businessType, 60),
    message: cleanText(b.message, 2000),
    productsInterested: Array.isArray(b.productsInterested)
      ? b.productsInterested.slice(0, 20).map((p) => cleanText(p, 200))
      : [],
    estimatedQuantity: cleanText(b.estimatedQuantity, 100),
    // `status`, `notes` and `assignedTo` are staff-controlled — never
    // accepted from a public submission.
  });
  sendResponse(res, 201, enquiry, 'Enquiry submitted');
});

// GET /enquiries/b2b — paginated, searchable, filterable.
//
// Was an unbounded find(): every enquiry ever submitted, in one response, on
// every page load. This is a public write endpoint, so the collection only
// grows.
const ENQUIRY_SORTS = sortableSet(['createdAt', 'companyName', 'status']);
const ENQUIRY_STATUSES = new Set(['new', 'contacted', 'in-progress', 'converted', 'closed']);
const BUSINESS_TYPES = new Set(['dealer', 'builder', 'architect', 'interior-designer', 'other']);

const getB2BEnquiries = asyncHandler(async (req, res) => {
  const { status, businessType } = req.query;
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 20, maxLimit: 200 });
  const sort = resolveSort(req.query.sort, ENQUIRY_SORTS, '-createdAt');

  const filter = {
    // Validate against the schema enum. An unknown value would otherwise
    // silently match nothing and read as "no enquiries exist".
    ...(ENQUIRY_STATUSES.has(status) && { status }),
    ...(BUSINESS_TYPES.has(businessType) && { businessType }),
    ...buildSearchFilter(req.query.search, [
      'companyName',
      'contactPerson',
      'email',
      'phone',
      'city',
    ]),
  };

  const [enquiries, total] = await Promise.all([
    B2BEnquiry.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    B2BEnquiry.countDocuments(filter),
  ]);

  sendResponse(
    res,
    200,
    listEnvelope(enquiries, total, page, limit),
    'Enquiries fetched'
  );
});

const updateB2BEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await B2BEnquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!enquiry) throw new ApiError(404, 'Enquiry not found.');
  sendResponse(res, 200, enquiry, 'Enquiry updated');
});

// ─── SERVICE REQUEST ─────────────────────────────
// Unauthenticated — allowlisted. `status`, `assignedTo`, `resolution` and
// `resolvedAt` are staff-controlled and must not be settable by a submitter.
const createServiceRequest = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const sr = await ServiceRequest.create({
    name: cleanText(b.name, 120),
    email: cleanText(b.email, 200),
    phone: cleanText(b.phone, 30),
    orderNumber: cleanText(b.orderNumber, 60),
    productName: cleanText(b.productName, 200),
    issueType: cleanText(b.issueType, 40),
    description: cleanText(b.description, 2000),
    images: cleanImages(b.images, 5),
    preferredDate: b.preferredDate ? new Date(b.preferredDate) : undefined,
    address: cleanText(b.address, 500),
    city: cleanText(b.city, 120),
  });
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

  if (!isValidObjectId(slotId)) throw new ApiError(400, 'A valid slot id is required.');

  // Claim the slot atomically. The previous read-then-write let two
  // concurrent bookings both see `isBooked: false` and both claim the slot,
  // with the second silently overwriting the first customer's details.
  const slot = await VideoCallSlot.findOneAndUpdate(
    { _id: slotId, isBooked: false, isActive: true },
    {
      isBooked: true,
      status: 'booked',
      booking: {
        customerName: cleanText(customerName, 120),
        customerEmail: cleanText(customerEmail, 200),
        customerPhone: cleanText(customerPhone, 30),
        message: cleanText(message, 2000),
        productsInterested: Array.isArray(productsInterested)
          ? productsInterested.slice(0, 20).map((p) => cleanText(p, 200))
          : [],
      },
    },
    { new: true }
  );

  if (!slot) throw new ApiError(400, 'Slot not available.');

  createAdminNotification(
    'new_booking',
    '📹 New Video Call Booked',
    `${customerName} booked a video call for ${new Date(slot.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${slot.startTime}`,
    '/bookings',
    { slotId: slot._id, customerName, customerEmail }
  );

  sendResponse(res, 200, slot, 'Video call booked successfully');
});

const createVideoCallSlot = asyncHandler(async (req, res) => {
  const slot = await VideoCallSlot.create(req.body);
  sendResponse(res, 201, slot, 'Slot created');
});

// Bulk: create slots for selected weekdays + time ranges for next N weeks
const createBulkVideoCallSlots = asyncHandler(async (req, res) => {
  const { days, timeSlots, weeksAhead = 4 } = req.body;

  if (!days?.length || !timeSlots?.length) {
    throw new ApiError(400, 'days and timeSlots are required.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(today);
  rangeEnd.setDate(today.getDate() + weeksAhead * 7);

  // Single query — fetch all existing slots in range
  const existing = await VideoCallSlot.find({
    date: { $gte: today, $lt: rangeEnd },
  }).select('date startTime').lean();

  // Build a Set of "dateString|startTime" for O(1) lookup
  const existingKeys = new Set(
    existing.map(s => `${new Date(s.date).toISOString().slice(0, 10)}|${s.startTime}`)
  );

  const slotsToCreate = [];
  for (let i = 0; i < weeksAhead * 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    if (!days.includes(date.getDay())) continue;

    const dateKey = date.toISOString().slice(0, 10);
    for (const ts of timeSlots) {
      if (!existingKeys.has(`${dateKey}|${ts.startTime}`)) {
        slotsToCreate.push({ date, startTime: ts.startTime, endTime: ts.endTime, isActive: true });
      }
    }
  }

  if (slotsToCreate.length === 0) {
    return sendResponse(res, 200, { count: 0 }, 'All slots already exist, nothing new created');
  }

  const created = await VideoCallSlot.insertMany(slotsToCreate);
  sendResponse(res, 201, { count: created.length }, `${created.length} slots created`);
});

// Get ALL slots (available + booked) for admin management
const getAllVideoCallSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const filter = {};
  if (date) {
    const d = new Date(date);
    filter.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
  } else {
    filter.date = { $gte: new Date() };
  }
  const slots = await VideoCallSlot.find(filter).sort('date startTime').lean();
  sendResponse(res, 200, slots, 'All slots fetched');
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

const deleteVideoCallSlot = asyncHandler(async (req, res) => {
  const slot = await VideoCallSlot.findById(req.params.id);
  if (!slot) throw new ApiError(404, 'Slot not found.');
  if (slot.isBooked) throw new ApiError(400, 'Cannot delete a booked slot.');
  await slot.deleteOne();
  sendResponse(res, 200, null, 'Slot deleted');
});

// ─── SITE VISIT ──────────────────────────────────
const bookSiteVisit = asyncHandler(async (req, res) => {
  const {
    customerName, email, phone, preferredDate, preferredTime,
    address, city, state, pincode, message, numberOfBathrooms,
    productId, productName, productImage,
  } = req.body;

  // Public endpoint: clean every free-text field and drop anything not
  // listed. `status` and `assignedTo` stay staff-controlled.
  const booking = await SiteVisitBooking.create({
    customerName: cleanText(customerName, 120),
    email: cleanText(email, 200),
    phone: cleanText(phone, 30),
    preferredDate: preferredDate ? new Date(preferredDate) : undefined,
    preferredTime: cleanText(preferredTime, 60),
    address: cleanText(address, 500),
    city: cleanText(city, 120),
    state: cleanText(state, 120),
    pincode: cleanText(pincode, 20),
    message: cleanText(message, 2000),
    numberOfBathrooms: Number.isFinite(Number(numberOfBathrooms))
      ? Math.max(0, Math.min(Math.trunc(Number(numberOfBathrooms)), 999))
      : undefined,
    productId: cleanText(productId, 60),
    productName: cleanText(productName, 200),
    productImage: isSafeUrl(productImage) ? productImage : undefined,
  });

  createAdminNotification(
    'new_site_visit',
    '🏠 New Site Visit Booked',
    `${booking.customerName} requested a site visit${booking.preferredDate ? ` on ${new Date(booking.preferredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}${booking.preferredTime ? ` at ${booking.preferredTime}` : ''}${booking.city ? ` — ${booking.city}` : ''}`,
    '/site-visits',
    { bookingId: booking._id, customerName: booking.customerName, city: booking.city }
  );

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
// REMOVED: `createRazorpayOrder` and `verifyPayment` used to live here.
//
// They were unrouted duplicates of the hardened implementations in
// payment.controller.js, and were dangerous to keep: `createRazorpayOrder`
// took the charge amount from the request body, and `verifyPayment` marked
// ANY order id paid once a signature — from any payment, including a ₹1 one —
// validated. Neither checked order ownership.
//
// Use payment.controller.js: createRazorpayOrder / confirmAndCreateOrder.

// ─── ANALYTICS (Dashboard) ──────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  // Assembly lives in services/analytics so the same figures can back a
  // scheduled report or an export without going through HTTP. Revenue
  // recognition is defined once, in services/analytics/revenueRules.js.
  const payload = await dashboardService.getDashboard(req.query);

  // Legacy keys retained alongside the new shape: the deployed admin may be
  // older than this server, and a dashboard that renders nothing is worse
  // than one showing slightly stale figures.
  const legacy = {
    stats: {
      totalOrders: payload.metrics.orders.value,
      totalRevenue: payload.metrics.netRevenue.value,
      totalProducts: payload.metrics.totalProducts.value,
      totalCustomers: payload.metrics.totalCustomers.value,
      pendingOrders: payload.metrics.awaitingFulfilment.value,
      pendingReviews: payload.metrics.pendingReviews.value,
      newEnquiries: payload.metrics.newEnquiries.value,
    },
    recentOrders: payload.lists.recentOrders,
    topProducts: payload.lists.topProducts,
    orderStatusDistribution: Object.fromEntries(
      Object.entries(payload.statusDistribution).map(([k, v]) => [k, v.count])
    ),
    lowStockProducts: payload.lists.deadStock,
  };

  sendResponse(res, 200, { ...payload, ...legacy }, 'Dashboard data fetched');
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

// GET /analytics/customers — paginated, searchable customer list.
//
// This previously returned `.limit(50)` with no pagination and no search, and
// the admin table filtered that array in the browser. Customer 51 was not
// merely on another page, it was unreachable from the UI entirely.
const CUSTOMER_SORTS = sortableSet(['createdAt', 'name', 'email']);

const getCustomerAnalytics = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 20, maxLimit: 200 });
  const sort = resolveSort(req.query.sort, CUSTOMER_SORTS, '-createdAt');

  const filter = {
    role: 'customer',
    ...buildSearchFilter(req.query.search, ['name', 'email', 'phone']),
  };

  const [customers, total] = await Promise.all([
    User.find(filter)
      .select('name email phone createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  sendResponse(
    res,
    200,
    listEnvelope(customers, total, page, limit),
    'Customer analytics fetched'
  );
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

  // Permission changes are exactly what an incident review needs and were
  // not previously recorded anywhere.
  await logActivity(req, 'create_admin_user', 'User', admin._id, { email: admin.email, role: admin.role });

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
  await logActivity(req, 'delete_admin_user', 'User', admin._id, { email: admin.email, role: admin.role });
  sendResponse(res, 200, null, 'Admin deleted');
});

const toggleAdminStatus = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.params.id);
  if (!admin) throw new ApiError(404, 'Admin not found.');
  if (admin.role === 'superadmin') throw new ApiError(403, 'Cannot deactivate super admin.');
  admin.isActive = !admin.isActive;
  await admin.save();
  await logActivity(req, admin.isActive ? 'activate_admin_user' : 'deactivate_admin_user', 'User', admin._id, { email: admin.email });
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
  getAvailableSlots, bookVideoCall, createVideoCallSlot, createBulkVideoCallSlots,
  getAllVideoCallSlots, getAllVideoCallBookings, updateVideoCallSlot, deleteVideoCallSlot,
  // Site Visit
  bookSiteVisit, getSiteVisitBookings, updateSiteVisitBooking,
  // Experience Centre
  getExperienceCentres, createExperienceCentre, updateExperienceCentre, deleteExperienceCentre,
  // Partner
  getPartners, createPartner, updatePartner, deletePartner,
  // Analytics
  getDashboard, getSalesReport, getCustomerAnalytics,
  // Admin Users
  getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, toggleAdminStatus,
};
