// ============================================
// OZOBATH - Response Serializers
// ============================================
// Every controller returned raw Mongoose documents. That is an allowlist
// inverted: any field added to a schema is published automatically, and the
// only thing that ever stripped anything was User.toJSON.
//
// These functions define what leaves the API. A field not named here is not
// sent, so adding `internalMargin` to the Product schema does not silently
// expose your cost price to every storefront visitor.

// Serialize one document or an array, tolerating null.
const many = (fn) => (docs) => (Array.isArray(docs) ? docs.map(fn).filter(Boolean) : []);

const pick = (doc, fields) => {
  if (!doc) return null;
  const src = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const out = {};
  for (const f of fields) {
    if (src[f] !== undefined) out[f] = src[f];
  }
  return out;
};

// ─── User ────────────────────────────────────────
// Never includes password, refreshToken, reset tokens, failedLoginAttempts
// or lockedUntil — the last two would tell an attacker whether their guessing
// is having an effect.
const user = (doc) => pick(doc, [
  '_id', 'name', 'email', 'phone', 'avatar', 'role', 'addresses',
]);

// For admin listings: no addresses (bulk PII), no role internals.
const userSummary = (doc) => pick(doc, ['_id', 'name', 'email', 'phone', 'createdAt']);

// Embedded in an order/review — the minimum to render a name.
const userRef = (doc) => pick(doc, ['_id', 'name', 'email', 'phone']);

// ─── Product ─────────────────────────────────────
// `costPrice` is deliberately absent: it is margin data and was previously
// returned to every visitor by the public product endpoints.
const PRODUCT_PUBLIC = [
  '_id', 'name', 'slug', 'description', 'shortDescription', 'sku', 'brand',
  'price', 'compareAtPrice', 'category', 'subCategory',
  'images', 'variants', 'specifications', 'badges', 'tags',
  'stock', 'isActive', 'isFeatured', 'freeDelivery', 'deliveryCharge',
  'weight', 'dimensions', 'avgRating', 'reviewCount', 'salesCount',
  'metaTitle', 'metaDescription', 'relatedProducts', 'createdAt',
];

const product = (doc) => pick(doc, PRODUCT_PUBLIC);

// Admin sees the commercial fields too.
const productAdmin = (doc) => pick(doc, [
  ...PRODUCT_PUBLIC, 'costPrice', 'lowStockThreshold', 'trackInventory', 'updatedAt',
]);

const productRef = (doc) => pick(doc, ['_id', 'name', 'slug', 'price', 'images']);

// ─── Order ───────────────────────────────────────
// `razorpaySignature` is omitted — it is a verification artefact with no
// client use, and publishing it hands out a valid signature for that payment.
const ORDER_FIELDS = [
  '_id', 'orderNumber', 'items', 'shippingAddress',
  'subtotal', 'shippingCost', 'discount', 'tax', 'total',
  'taxableValue', 'taxMode', 'taxRate',
  'coupon', 'paymentMethod', 'paymentStatus', 'status',
  'trackingNumber', 'trackingUrl', 'notes', 'statusHistory',
  'estimatedDelivery', 'deliveredAt', 'createdAt', 'updatedAt',
];

const order = (doc) => {
  const out = pick(doc, ORDER_FIELDS);
  if (!out) return null;
  const src = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  if (src.user && typeof src.user === 'object') out.user = userRef(src.user);
  else if (src.user) out.user = src.user;
  return out;
};

// Admin additionally sees the gateway ids and the refund ledger, for support
// and reconciliation — but still not the signature.
const orderAdmin = (doc) => {
  const out = order(doc);
  if (!out) return null;
  const src = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  out.razorpayOrderId = src.razorpayOrderId;
  out.razorpayPaymentId = src.razorpayPaymentId;
  out.refunds = src.refunds;
  out.refundedTotal = src.refundedTotal;
  return out;
};

// ─── Review ──────────────────────────────────────
// `helpfulVoters` is an array of user ids — internal bookkeeping, not content.
const review = (doc) => {
  const out = pick(doc, [
    '_id', 'product', 'rating', 'title', 'comment', 'images',
    'isApproved', 'isVerifiedPurchase', 'helpfulCount', 'createdAt',
  ]);
  if (!out) return null;
  const src = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  if (src.user && typeof src.user === 'object') {
    // Public reviews show a display name and avatar only — never the
    // reviewer's email, which the admin listing used to populate.
    out.user = pick(src.user, ['_id', 'name', 'avatar']);
  }
  return out;
};

// ─── Coupon ──────────────────────────────────────
// The customer-facing shape. `usedBy` is a list of every user who redeemed
// it, and `usedCount`/`usageLimit` reveal campaign internals.
const couponPublic = (doc) => pick(doc, [
  'code', 'type', 'value', 'description', 'minOrderAmount', 'maxDiscount',
]);

const couponAdmin = (doc) => pick(doc, [
  '_id', 'code', 'description', 'type', 'value', 'minOrderAmount', 'maxDiscount',
  'usageLimit', 'usedCount', 'perUserLimit', 'isActive', 'startDate', 'endDate',
  'applicableCategories', 'applicableProducts', 'createdAt',
]);

// ─── Cart ────────────────────────────────────────
const cart = (doc) => {
  if (!doc) return { items: [], totalAmount: 0 };
  const src = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    _id: src._id,
    items: (src.items || []).map((i) => ({
      _id: i._id,
      product: i.product && typeof i.product === 'object' ? product(i.product) : i.product,
      quantity: i.quantity,
      variant: i.variant,
      price: i.price,
    })),
    totalAmount: src.totalAmount,
  };
};

module.exports = {
  user, userSummary, userRef,
  product, productAdmin, productRef,
  order, orderAdmin,
  review, couponPublic, couponAdmin, cart,
  many,
  // Lists
  users: many(userSummary),
  products: many(product),
  productsAdmin: many(productAdmin),
  orders: many(order),
  ordersAdmin: many(orderAdmin),
  reviews: many(review),
  couponsAdmin: many(couponAdmin),
};
