// ============================================
// Tests — validation layer and serializers (Phase 3)
// ============================================

require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const { applySchema } = require('../src/middleware/validate');
const S = require('../src/schemas');
const ser = require('../src/serializers');

const accept = (schema, input) => {
  const r = applySchema(input, schema);
  assert.equal(r.errors.length, 0, `expected accept, got: ${r.errors.join('; ')}`);
  return r.value;
};
const reject = (schema, input, pattern) => {
  const r = applySchema(input, schema);
  assert.ok(r.errors.length > 0, 'expected rejection');
  if (pattern) assert.match(r.errors.join('; '), pattern);
  return r.errors;
};

const OID = '507f1f77bcf86cd799439011';

// ─── Mass assignment is structurally impossible ──

test('unknown keys are dropped, not merged', () => {
  // The whole point of the layer: a privilege field cannot ride along even
  // if a controller would otherwise pass it straight to Mongoose.
  const v = accept(S.updateProfile, { name: 'Bob', role: 'superadmin', isActive: true, _id: 'x' });
  assert.deepEqual(v, { name: 'Bob' });
  assert.equal(v.role, undefined);
});

test('coupon counters cannot be set from a request', () => {
  const v = accept(S.upsertCoupon, {
    code: 'SAVE10', type: 'percentage', value: 10,
    startDate: '2026-01-01', endDate: '2026-12-31',
    usedCount: 0, usedBy: [],       // derived — must be dropped
  });
  assert.equal(v.usedCount, undefined);
  assert.equal(v.usedBy, undefined);
});

// ─── Quantity (the Phase 2 chain, now at the boundary) ──

test('cart quantity rejects negative, zero, fractional and over-limit', () => {
  reject(S.addToCart, { productId: OID, quantity: -1 }, /at least 1/);
  reject(S.addToCart, { productId: OID, quantity: 0.5 }, /whole number/);
  reject(S.addToCart, { productId: OID, quantity: 51 }, /at most 50/);
  reject(S.addToCart, { productId: OID, quantity: 'abc' }, /whole number/);
  assert.equal(accept(S.addToCart, { productId: OID, quantity: 3 }).quantity, 3);
});

test('cart quantity defaults to 1 when omitted', () => {
  assert.equal(accept(S.addToCart, { productId: OID }).quantity, 1);
});

// ─── Operator injection ──────────────────────────

test('an operator object is rejected where a string is expected', () => {
  reject(S.login, { email: { $ne: null }, password: 'x' }, /email/);
  reject(S.addToCart, { productId: { $ne: null } }, /valid id/);
});

test('objectId fields reject non-ids', () => {
  reject(S.codOrder, { orderId: 'not-an-id' }, /valid id/);
  reject(S.codOrder, { orderId: '../../etc/passwd' }, /valid id/);
  assert.equal(accept(S.codOrder, { orderId: OID }).orderId, OID);
});

// ─── XSS / content ───────────────────────────────

test('review comment is stripped of markup at the boundary', () => {
  const v = accept(S.createReview, {
    product: OID, rating: 5,
    comment: '<img src=x onerror="steal()">Nice product',
  });
  assert.ok(!v.comment.includes('<'), 'no markup may survive');
  assert.ok(!v.comment.includes('onerror'), 'no handler may survive');
  assert.match(v.comment, /Nice product/);
});

test('review rating must be an integer 1-5', () => {
  reject(S.createReview, { product: OID, rating: 9, comment: 'x' }, /at most 5/);
  reject(S.createReview, { product: OID, rating: 0, comment: 'x' }, /at least 1/);
  reject(S.createReview, { product: OID, rating: 4.5, comment: 'x' }, /whole number/);
});

test('image urls must be http(s)', () => {
  reject(S.createReview, {
    product: OID, rating: 5, comment: 'x',
    images: [{ url: 'javascript:alert(1)' }],
  }, /url|URL/);
});

// ─── Money ───────────────────────────────────────

test('refund amount must be positive', () => {
  reject(S.refund, { amount: -500 }, /at least/);
  reject(S.refund, { amount: 0 }, /at least/);
  assert.equal(accept(S.refund, { amount: 250.5 }).amount, 250.5);
});

test('order status must be a known status', () => {
  reject(S.updateOrderStatus, { status: 'paid' }, /must be one of/);
  reject(S.updateOrderStatus, { status: '__proto__' }, /must be one of/);
  assert.equal(accept(S.updateOrderStatus, { status: 'shipped' }).status, 'shipped');
});

// ─── Required fields ─────────────────────────────

test('required fields are enforced and all errors reported at once', () => {
  const errs = reject(S.confirmPayment, {});
  assert.ok(errs.length >= 4, `expected several errors, got ${errs.length}`);
});

test('a nested address enforces its own required fields', () => {
  reject(S.createOrder, { shippingAddress: { city: 'Bengaluru' } }, /shippingAddress/);
  const v = accept(S.createOrder, {
    shippingAddress: { line1: '1 Main St', city: 'Bengaluru', pincode: '560001' },
  });
  assert.equal(v.shippingAddress.city, 'Bengaluru');
});

// ─── Serializers ─────────────────────────────────

test('user serializer never emits credentials', () => {
  const out = ser.user({
    _id: '1', name: 'A', email: 'a@b.com', role: 'admin',
    password: 'hashed', refreshToken: 'tok', passwordResetToken: 'r',
    failedLoginAttempts: 3, lockedUntil: new Date(),
  });
  for (const leaked of ['password', 'refreshToken', 'passwordResetToken', 'failedLoginAttempts', 'lockedUntil']) {
    assert.equal(out[leaked], undefined, `${leaked} must not be serialized`);
  }
  assert.equal(out.name, 'A');
});

test('product serializer withholds cost price from the public shape', () => {
  const doc = { _id: '1', name: 'P', price: 100, costPrice: 40, stock: 5 };
  assert.equal(ser.product(doc).costPrice, undefined, 'margin data must not be public');
  assert.equal(ser.productAdmin(doc).costPrice, 40, 'admin may see it');
});

test('order serializer withholds the razorpay signature', () => {
  const doc = {
    _id: '1', orderNumber: 'OZO-1', total: 100,
    razorpayOrderId: 'o1', razorpayPaymentId: 'p1', razorpaySignature: 'sig',
  };
  assert.equal(ser.order(doc).razorpaySignature, undefined);
  assert.equal(ser.orderAdmin(doc).razorpaySignature, undefined,
    'not even admin — publishing it hands out a valid signature');
  assert.equal(ser.orderAdmin(doc).razorpayPaymentId, 'p1');
});

test('review serializer does not leak the reviewer email or voter list', () => {
  const out = ser.review({
    _id: '1', rating: 5, comment: 'ok', helpfulCount: 2,
    helpfulVoters: ['u1', 'u2'],
    user: { _id: 'u9', name: 'Reviewer', email: 'private@example.com' },
  });
  assert.equal(out.helpfulVoters, undefined);
  assert.equal(out.user.email, undefined);
  assert.equal(out.user.name, 'Reviewer');
});

test('public coupon shape hides campaign internals', () => {
  const out = ser.couponPublic({
    code: 'SAVE10', type: 'percentage', value: 10,
    usedCount: 42, usageLimit: 100, usedBy: ['u1', 'u2'],
  });
  assert.equal(out.usedCount, undefined);
  assert.equal(out.usedBy, undefined);
  assert.equal(out.code, 'SAVE10');
});

test('list serializers tolerate null and non-arrays', () => {
  assert.deepEqual(ser.products(null), []);
  assert.deepEqual(ser.orders(undefined), []);
});
