// ============================================
// Tests — pricing, tax and discount arithmetic
// ============================================
// calculateTotals is the single source of truth for what a cart costs, and
// every payment path derives its Razorpay amount from it. An error here is
// charged to a real card, so the arithmetic is pinned explicitly.

require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateTotals, calculateShipping, calculateDiscount, calculateTax,
  FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_COST,
} = require('../src/utils/calculateTotals');

const item = (price, quantity = 1, extra = {}) => ({
  product: { price, isActive: true, ...extra },
  quantity,
});

// ─── Shipping ────────────────────────────────────

test('shipping is free at or above the threshold', () => {
  const below = calculateTotals([item(FREE_SHIPPING_THRESHOLD - 1)]);
  const at = calculateTotals([item(FREE_SHIPPING_THRESHOLD)]);
  assert.equal(below.shippingCost, FLAT_SHIPPING_COST);
  assert.equal(at.shippingCost, 0, 'the threshold itself must qualify');
});

test('an empty cart is never charged shipping', () => {
  // every() on an empty array is true, so without an explicit guard the
  // threshold rule would bill the flat rate on a zero-item cart.
  assert.equal(calculateShipping([], 0), 0);
});

test('a per-product delivery charge takes the highest, not the sum', () => {
  const totals = calculateTotals([
    item(500, 1, { deliveryCharge: 300 }),
    item(500, 1, { deliveryCharge: 150 }),
  ]);
  assert.equal(totals.shippingCost, 300);
});

test('freeDelivery on every item means no shipping, regardless of subtotal', () => {
  const totals = calculateTotals([item(100, 1, { freeDelivery: true })]);
  assert.equal(totals.shippingCost, 0);
});

test('a free-delivery item does not discount another item\'s charge', () => {
  // Documented behaviour: mixing free-delivery with a charged item bills the
  // charge. Pinned because changing it is a pricing decision, not a refactor.
  const totals = calculateTotals([
    item(500, 1, { freeDelivery: true }),
    item(500, 1, { deliveryCharge: 300 }),
  ]);
  assert.equal(totals.shippingCost, 300);
});

// ─── Discount ────────────────────────────────────

test('percentage discount respects maxDiscount', () => {
  const d = calculateDiscount({ type: 'percentage', value: 50, maxDiscount: 100 }, 1000);
  assert.equal(d, 100, 'capped at maxDiscount, not 500');
});

test('discount can never exceed the subtotal', () => {
  // Otherwise a fixed coupon larger than the cart produces a negative total.
  const d = calculateDiscount({ type: 'fixed', value: 99999 }, 500);
  assert.equal(d, 500);
});

test('a coupon below its minimum order amount gives no discount', () => {
  const d = calculateDiscount({ type: 'fixed', value: 100, minOrderAmount: 1000 }, 999);
  assert.equal(d, 0);
});

test('no coupon means no discount', () => {
  assert.equal(calculateDiscount(null, 1000), 0);
});

test('a discount never drives the total below zero', () => {
  const totals = calculateTotals([item(100)], { type: 'fixed', value: 100000 });
  assert.ok(totals.total >= 0, `total was ${totals.total}`);
});

// ─── Tax ─────────────────────────────────────────

test('exclusive tax is added on top of the price', () => {
  const { tax, total } = calculateTax({
    subtotal: 1000, shippingCost: 0, discount: 0,
    mode: 'exclusive', taxShipping: false, afterDiscount: false, rate: 0.18,
  });
  assert.equal(tax, 180);
  assert.equal(total, 1180);
});

test('inclusive tax is extracted, and the customer pays the listed price', () => {
  const { tax, total } = calculateTax({
    subtotal: 1180, shippingCost: 0, discount: 0,
    mode: 'inclusive', taxShipping: false, afterDiscount: false, rate: 0.18,
  });
  assert.equal(tax, 180, '₹1180 at 18% contains ₹180 of tax');
  assert.equal(total, 1180, 'nothing is added on top');
});

test('taxAfterDiscount lowers the taxable base', () => {
  const gross = calculateTax({
    subtotal: 1000, shippingCost: 0, discount: 200,
    mode: 'exclusive', taxShipping: false, afterDiscount: false, rate: 0.18,
  });
  const net = calculateTax({
    subtotal: 1000, shippingCost: 0, discount: 200,
    mode: 'exclusive', taxShipping: false, afterDiscount: true, rate: 0.18,
  });
  assert.equal(gross.tax, 180, 'taxed on the gross subtotal');
  assert.equal(net.tax, 144, 'taxed on 800 after the discount');
});

test('taxOnShipping includes the delivery charge in the base', () => {
  const off = calculateTax({
    subtotal: 500, shippingCost: 99, discount: 0,
    mode: 'exclusive', taxShipping: false, afterDiscount: false, rate: 0.18,
  });
  const on = calculateTax({
    subtotal: 500, shippingCost: 99, discount: 0,
    mode: 'exclusive', taxShipping: true, afterDiscount: false, rate: 0.18,
  });
  assert.equal(off.tax, 90);
  assert.equal(on.tax, Math.round(599 * 0.18));
});

// ─── Money integrity ─────────────────────────────

test('all monetary outputs are integers — no float drift', () => {
  // A cart engineered to produce repeating decimals under naive arithmetic.
  const totals = calculateTotals([item(333, 3), item(0.1 * 10 * 7)]);
  for (const key of ['subtotal', 'shippingCost', 'tax', 'discount', 'total']) {
    assert.ok(Number.isInteger(totals[key]), `${key} was ${totals[key]}, expected an integer`);
  }
});

test('the total equals its parts exactly', () => {
  const totals = calculateTotals(
    [item(1200, 2)],
    { type: 'percentage', value: 10, maxDiscount: 500 }
  );
  const expected = totals.subtotal + totals.shippingCost + totals.tax - totals.discount;
  assert.equal(totals.total, expected, 'total must reconcile with its components');
});

test('inactive products are excluded from the priced set', () => {
  const totals = calculateTotals([
    item(1000),
    { product: { price: 5000, isActive: false }, quantity: 1 },
  ]);
  assert.equal(totals.subtotal, 1000, 'an inactive product must not be charged');
  assert.equal(totals.activeItems.length, 1);
});

test('items with a missing product reference are skipped', () => {
  const totals = calculateTotals([item(1000), { product: null, quantity: 5 }]);
  assert.equal(totals.subtotal, 1000);
});

test('an empty cart prices to zero throughout', () => {
  const totals = calculateTotals([]);
  assert.equal(totals.subtotal, 0);
  assert.equal(totals.shippingCost, 0);
  assert.equal(totals.tax, 0);
  assert.equal(totals.total, 0);
});
