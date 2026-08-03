// ============================================
// OZOBATH - Request Schemas
// ============================================
// One place to see what every boundary accepts. A field absent from a schema
// cannot reach a controller, so mass assignment is prevented by construction
// rather than by remembering to allowlist at each call site.

const env = require('../config/env');

// ─── Shared fragments ────────────────────────────

const addressShape = {
  fullName: { type: 'string', max: 120 },
  phone:    { type: 'string', max: 20 },
  line1:    { type: 'string', max: 200, required: true },
  line2:    { type: 'string', max: 200 },
  city:     { type: 'string', max: 100, required: true },
  state:    { type: 'string', max: 100 },
  pincode:  { type: 'string', max: 12, required: true },
};

const imageShape = {
  url:      { type: 'url', required: true },
  publicId: { type: 'string', max: 200 },
  alt:      { type: 'string', max: 200 },
};

// ─── Auth ────────────────────────────────────────

const register = {
  name:     { type: 'string', min: 1, max: 120, required: true },
  email:    { type: 'email', required: true },
  phone:    { type: 'string', max: 20 },
  // `raw` keeps the password byte-exact — cleanText would strip characters
  // that are legitimate in a passphrase.
  password: { type: 'string', min: 8, max: 200, required: true, raw: true },
};

const login = {
  email:    { type: 'email', required: true },
  password: { type: 'string', min: 1, max: 200, required: true, raw: true },
};

const updateProfile = {
  name:   { type: 'string', max: 120 },
  phone:  { type: 'string', max: 20 },
  avatar: { type: 'object', shape: { url: { type: 'url' }, publicId: { type: 'string', max: 200 } } },
};

const address = {
  ...addressShape,
  label:     { type: 'string', max: 50 },
  isDefault: { type: 'boolean' },
};

// ─── Cart ────────────────────────────────────────

const addToCart = {
  productId: { type: 'objectId', required: true },
  quantity:  { type: 'int', min: 1, max: env.MAX_ORDER_QUANTITY, default: 1 },
  variant:   { type: 'string', max: 100 },
};

const updateCartItem = {
  itemId:   { type: 'objectId', required: true },
  quantity: { type: 'int', min: 1, max: env.MAX_ORDER_QUANTITY, required: true },
};

const mergeCart = {
  items: {
    type: 'array', max: 100, required: true,
    of: {
      type: 'object',
      shape: {
        productId: { type: 'string', max: 50, required: true },
        quantity:  { type: 'int', min: 1, max: env.MAX_ORDER_QUANTITY, default: 1 },
        variant:   { type: 'string', max: 100 },
      },
    },
  },
};

// ─── Orders & payment ────────────────────────────

const createOrder = {
  shippingAddress: { type: 'object', shape: addressShape, required: true },
  paymentMethod:   { type: 'string', enum: ['razorpay', 'cod'], default: 'razorpay' },
  couponCode:      { type: 'string', max: 50 },
  notes:           { type: 'string', max: 1000 },
};

const createRazorpayOrder = {
  couponCode:      { type: 'string', max: 50 },
  shippingAddress: { type: 'object', shape: addressShape },
};

const confirmPayment = {
  // Razorpay ids and the hex signature — `raw` so they are compared exactly
  // as sent; any transformation would break signature verification.
  razorpay_order_id:   { type: 'string', max: 100, required: true, raw: true },
  razorpay_payment_id: { type: 'string', max: 100, required: true, raw: true },
  razorpay_signature:  { type: 'string', max: 200, required: true, raw: true },
  shippingAddress:     { type: 'object', shape: addressShape, required: true },
  couponCode:          { type: 'string', max: 50 },
};

const codOrder = {
  orderId: { type: 'objectId', required: true },
};

const updateOrderStatus = {
  status: {
    type: 'string', required: true,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
  },
  note:           { type: 'string', max: 500 },
  trackingNumber: { type: 'string', max: 100 },
  trackingUrl:    { type: 'url' },
};

const cancelOrder = {
  reason: { type: 'string', max: 500, default: 'Cancelled by customer' },
};

const refund = {
  amount: { type: 'number', min: 0.01 },
  reason: { type: 'string', max: 500 },
};

// ─── Reviews ─────────────────────────────────────

const createReview = {
  product: { type: 'objectId', required: true },
  rating:  { type: 'int', min: 1, max: 5, required: true },
  title:   { type: 'string', max: 200 },
  comment: { type: 'string', min: 1, max: 2000, required: true },
  images:  { type: 'array', max: 5, of: { type: 'object', shape: imageShape } },
};

// ─── Coupons ─────────────────────────────────────

const validateCoupon = {
  code:        { type: 'string', max: 50, required: true },
  orderAmount: { type: 'number', min: 0 },
};

const upsertCoupon = {
  code:                 { type: 'string', max: 50, required: true },
  description:          { type: 'string', max: 500 },
  type:                 { type: 'string', enum: ['percentage', 'fixed'], required: true },
  value:                { type: 'number', min: 0, required: true },
  minOrderAmount:       { type: 'number', min: 0 },
  maxDiscount:          { type: 'number', min: 0 },
  usageLimit:           { type: 'int', min: 1 },
  perUserLimit:         { type: 'int', min: 1 },
  isActive:             { type: 'boolean' },
  startDate:            { type: 'date', required: true },
  endDate:              { type: 'date', required: true },
  applicableCategories: { type: 'array', max: 100, of: { type: 'objectId' } },
  applicableProducts:   { type: 'array', max: 500, of: { type: 'objectId' } },
};

// ─── Public submissions ──────────────────────────

const b2bEnquiry = {
  companyName:        { type: 'string', max: 200, required: true },
  contactPerson:      { type: 'string', max: 120, required: true },
  email:              { type: 'email', required: true },
  phone:              { type: 'string', max: 20, required: true },
  city:               { type: 'string', max: 100 },
  state:              { type: 'string', max: 100 },
  businessType:       { type: 'string', enum: ['dealer', 'builder', 'architect', 'interior-designer', 'other'] },
  message:            { type: 'string', max: 2000 },
  productsInterested: { type: 'array', max: 20, of: { type: 'string', max: 200 } },
  estimatedQuantity:  { type: 'string', max: 100 },
};

const serviceRequest = {
  name:          { type: 'string', max: 120, required: true },
  email:         { type: 'email', required: true },
  phone:         { type: 'string', max: 20, required: true },
  orderNumber:   { type: 'string', max: 60 },
  productName:   { type: 'string', max: 200 },
  issueType:     { type: 'string', enum: ['installation', 'repair', 'replacement', 'warranty', 'general', 'other'] },
  description:   { type: 'string', min: 1, max: 2000, required: true },
  images:        { type: 'array', max: 5, of: { type: 'object', shape: imageShape } },
  preferredDate: { type: 'date' },
  address:       { type: 'string', max: 500 },
  city:          { type: 'string', max: 100 },
};

const siteVisit = {
  customerName:      { type: 'string', max: 120, required: true },
  email:             { type: 'email', required: true },
  phone:             { type: 'string', max: 20, required: true },
  preferredDate:     { type: 'date' },
  preferredTime:     { type: 'string', max: 60 },
  address:           { type: 'string', max: 500 },
  city:              { type: 'string', max: 100 },
  state:             { type: 'string', max: 100 },
  pincode:           { type: 'string', max: 12 },
  message:           { type: 'string', max: 2000 },
  numberOfBathrooms: { type: 'int', min: 0, max: 999 },
  productId:         { type: 'string', max: 60 },
  productName:       { type: 'string', max: 200 },
  productImage:      { type: 'url' },
};

const videoCallBooking = {
  slotId:             { type: 'objectId', required: true },
  customerName:       { type: 'string', max: 120, required: true },
  customerEmail:      { type: 'email', required: true },
  customerPhone:      { type: 'string', max: 20, required: true },
  message:            { type: 'string', max: 2000 },
  productsInterested: { type: 'array', max: 20, of: { type: 'string', max: 200 } },
};

const newsletterSubscribe = { email: { type: 'email', required: true } };

// ─── CMS (admin-authenticated) ───────────────────
// These are lower risk than the public endpoints — an admin is trusted — but
// raw req.body still let a write set derived fields, store unbounded
// documents, or forge `author` attribution.

// Mirrors models/Banner.js exactly. `image`/`mobileImage` are objects
// ({url, publicId, alt}), not bare URLs, and the button label is
// `buttonText` — the admin form sends both in that shape.
const banner = {
  title:       { type: 'string', max: 200 },
  subtitle:    { type: 'string', max: 300 },
  description: { type: 'string', max: 1000 },
  image:       { type: 'object', shape: { url: { type: 'url', required: true }, publicId: { type: 'string', max: 200 }, alt: { type: 'string', max: 200 } } },
  mobileImage: { type: 'object', shape: { url: { type: 'url' }, publicId: { type: 'string', max: 200 } } },
  link:        { type: 'string', max: 500 },
  buttonText:  { type: 'string', max: 60 },
  page:        { type: 'string', enum: ['home', 'shop', 'about', 'contact', 'category'] },
  position:    { type: 'string', enum: ['hero', 'promo', 'category', 'sidebar'] },
  order:       { type: 'int', min: 0, max: 9999 },
  isActive:    { type: 'boolean' },
  startDate:   { type: 'date' },
  endDate:     { type: 'date' },
  textColor:   { type: 'string', max: 30 },
  overlayColor: { type: 'string', max: 30 },
};

// Mirrors models/Category.js. SEO fields are `seoTitle`/`seoDescription`
// (not meta*), `image` is an object, and `slug`/`productCount` are derived —
// deliberately absent so a write cannot corrupt them.
const category = {
  name:           { type: 'string', max: 120, required: true },
  description:    { type: 'string', max: 2000 },
  image:          { type: 'object', shape: { url: { type: 'url' }, publicId: { type: 'string', max: 200 } } },
  parent:         { type: 'objectId' },
  order:          { type: 'int', min: 0, max: 9999 },
  isActive:       { type: 'boolean' },
  seoTitle:       { type: 'string', max: 200 },
  seoDescription: { type: 'string', max: 500 },
};

// `author` is set from req.user, never from the body — accepting it allowed
// attribution forgery.
// Mirrors models/Blog.js. `author`, `slug`, `publishedAt` and `views` are
// server-controlled and deliberately absent — accepting `author` allowed
// attribution forgery.
const blog = {
  title:          { type: 'string', max: 300, required: true },
  excerpt:        { type: 'string', max: 500 },
  // `raw` preserves the editor's markup; blog bodies are authored by admins
  // and rendered as rich content, unlike customer-submitted review text.
  content:        { type: 'string', max: 100000, required: true, raw: true },
  featuredImage:  { type: 'object', shape: { url: { type: 'url' }, publicId: { type: 'string', max: 200 }, alt: { type: 'string', max: 200 } } },
  category:       { type: 'string', max: 100 },
  tags:           { type: 'array', max: 30, of: { type: 'string', max: 60 } },
  isPublished:    { type: 'boolean' },
  seoTitle:       { type: 'string', max: 200 },
  seoDescription: { type: 'string', max: 500 },
  seoKeywords:    { type: 'array', max: 30, of: { type: 'string', max: 60 } },
};

const faq = {
  question: { type: 'string', max: 500, required: true },
  answer:   { type: 'string', max: 5000, required: true },
  category: { type: 'string', max: 100 },
  order:    { type: 'int', min: 0, max: 9999 },
  isActive: { type: 'boolean' },
};

// Mirrors models/Testimonial.js: the text field is `comment` (not
// `message`), and the person's title is `designation` + `company`.
const testimonial = {
  name:        { type: 'string', max: 120, required: true },
  designation: { type: 'string', max: 120 },
  company:     { type: 'string', max: 120 },
  avatar:      { type: 'object', shape: { url: { type: 'url' }, publicId: { type: 'string', max: 200 } } },
  rating:      { type: 'int', min: 1, max: 5 },
  comment:     { type: 'string', max: 2000, required: true },
  order:       { type: 'int', min: 0, max: 9999 },
  isActive:    { type: 'boolean' },
};



module.exports = {
  register, login, updateProfile, address,
  addToCart, updateCartItem, mergeCart,
  createOrder, createRazorpayOrder, confirmPayment, codOrder,
  updateOrderStatus, cancelOrder, refund,
  createReview,
  validateCoupon, upsertCoupon,
  b2bEnquiry, serviceRequest, siteVisit, videoCallBooking, newsletterSubscribe,
  banner, category, blog, faq, testimonial,
};
