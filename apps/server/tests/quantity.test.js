// ============================================
// Regression tests — line item quantity integrity
// ============================================
// These cover the chain traced in the negative/fractional quantity audit:
//   cart write  →  calculateTotals  →  PendingCheckout  →  stock $inc
//
// Every test here fails on the pre-fix code.

require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseQuantity } = require('../src/utils/validateQuantity');
const { calculateTotals } = require('../src/utils/calculateTotals');

const MAX = 50;

// ─── parseQuantity — the shared entry-point guard ────────────────
// Every cart write path (add / update / merge) routes through this, so
// asserting it here covers all three without needing a live database.

test('parseQuantity rejects negative quantities', () => {
  assert.equal(parseQuantity(-1), null);
  assert.equal(parseQuantity(-50), null);
  assert.equal(parseQuantity('-5'), null);
});

test('parseQuantity rejects zero', () => {
  assert.equal(parseQuantity(0), null);
  assert.equal(parseQuantity('0'), null);
});

test('parseQuantity rejects fractional quantities', () => {
  // The live defect: min:1 was satisfied, so 0.5 halved the line total and
  // reached Razorpay as a real discount.
  assert.equal(parseQuantity(0.5), null);
  assert.equal(parseQuantity(1.5), null);
  assert.equal(parseQuantity(2.7), null);
  assert.equal(parseQuantity('1.5'), null);
});

test('parseQuantity rejects NaN, Infinity and non-numeric input', () => {
  // `quantity < 1` was false for all of these, so they passed the old guard.
  assert.equal(parseQuantity(NaN), null);
  assert.equal(parseQuantity(Infinity), null);
  assert.equal(parseQuantity(-Infinity), null);
  assert.equal(parseQuantity('abc'), null);
  assert.equal(parseQuantity(null), null);
  assert.equal(parseQuantity(undefined), null);
  assert.equal(parseQuantity({}), null);
  assert.equal(parseQuantity([]), null);
});

test('parseQuantity enforces the configured upper bound', () => {
  assert.equal(parseQuantity(MAX), MAX, 'the limit itself is allowed');
  assert.equal(parseQuantity(MAX + 1), null);
  assert.equal(parseQuantity(1e9), null);
  assert.equal(parseQuantity(Number.MAX_SAFE_INTEGER), null);
});

test('parseQuantity accepts valid integers and numeric strings', () => {
  assert.equal(parseQuantity(1), 1);
  assert.equal(parseQuantity(7), 7);
  assert.equal(parseQuantity('3'), 3);
});

// ─── calculateTotals — defence in depth ──────────────────────────

const item = (price, quantity) => ({
  product: { price, isActive: true },
  quantity,
});

test('calculateTotals prices a valid cart correctly', () => {
  const { subtotal, total } = calculateTotals([item(1000, 2)]);
  assert.equal(subtotal, 2000);
  assert.ok(total > subtotal, 'exclusive tax is added on top');
});

test('calculateTotals throws on a negative quantity instead of reducing the subtotal', () => {
  // Pre-fix: subtotal -4000, tax -720, total floored to 0 — a free order.
  assert.throws(
    () => calculateTotals([item(1000, 1), item(5000, -1)]),
    /Invalid line item quantity/
  );
});

test('calculateTotals throws on a fractional quantity', () => {
  // Pre-fix: subtotal 500 on a 1000 item — a silent 50% discount.
  assert.throws(() => calculateTotals([item(1000, 0.5)]), /Invalid line item quantity/);
});

test('calculateTotals throws on a zero quantity', () => {
  assert.throws(() => calculateTotals([item(1000, 0)]), /Invalid line item quantity/);
});

test('calculateTotals subtotal is never below the sum of valid line items', () => {
  // The core invariant: no combination of accepted inputs may drive the
  // subtotal below what the valid lines are worth.
  const lines = [item(1000, 1), item(250, 3), item(99, 2)];
  const expected = 1000 * 1 + 250 * 3 + 99 * 2;

  const { subtotal } = calculateTotals(lines);
  assert.equal(subtotal, expected);
  assert.ok(subtotal >= 0);

  // And a poisoned line cannot subtract from that sum — it fails closed.
  assert.throws(() => calculateTotals([...lines, item(9999, -1)]), /Invalid line item quantity/);
});

test('calculateTotals never produces a negative tax or taxable value', () => {
  // Pre-fix these persisted negative onto the Order document even though
  // `total` itself floored at zero.
  const { tax, taxableValue, total } = calculateTotals([item(1000, 1)]);
  assert.ok(tax >= 0, 'tax must not be negative');
  assert.ok(taxableValue >= 0, 'taxable value must not be negative');
  assert.ok(total >= 0);
});
