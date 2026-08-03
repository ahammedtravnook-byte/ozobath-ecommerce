// ============================================
// Regression tests — order status state machine (C-03)
// ============================================
// Pre-fix, `order.status = req.body.status` accepted any value from any
// state, and `status === 'confirmed'` set paymentStatus = 'paid'.

require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const { canTransition, isValidStatus, explainTransition, ORDER_STATUSES } =
  require('../src/utils/orderStateMachine');

test('the happy path is allowed end to end', () => {
  assert.ok(canTransition('pending', 'confirmed'));
  assert.ok(canTransition('confirmed', 'processing'));
  assert.ok(canTransition('processing', 'shipped'));
  assert.ok(canTransition('shipped', 'delivered'));
});

test('an unpaid order cannot skip straight to shipped', () => {
  assert.equal(canTransition('pending', 'shipped'), false);
  assert.equal(canTransition('pending', 'delivered'), false);
});

test('a delivered order cannot be walked back', () => {
  // This is what let a refunded+cancelled order return to `delivered`,
  // erasing the refund from the order's apparent state.
  assert.equal(canTransition('delivered', 'shipped'), false);
  assert.equal(canTransition('delivered', 'confirmed'), false);
  assert.equal(canTransition('delivered', 'pending'), false);
  assert.equal(canTransition('delivered', 'cancelled'), false);
});

test('cancelled is terminal', () => {
  for (const to of ORDER_STATUSES) {
    assert.equal(canTransition('cancelled', to), false, `cancelled -> ${to} must be rejected`);
  }
});

test('returned is terminal', () => {
  for (const to of ORDER_STATUSES) {
    assert.equal(canTransition('returned', to), false, `returned -> ${to} must be rejected`);
  }
});

test('a shipped order cannot be cancelled, only returned', () => {
  assert.equal(canTransition('shipped', 'cancelled'), false);
  assert.ok(canTransition('shipped', 'returned'));
});

test('cancellation is allowed only before shipping', () => {
  assert.ok(canTransition('pending', 'cancelled'));
  assert.ok(canTransition('confirmed', 'cancelled'));
  assert.ok(canTransition('processing', 'cancelled'));
  assert.equal(canTransition('shipped', 'cancelled'), false);
  assert.equal(canTransition('delivered', 'cancelled'), false);
});

test('unknown statuses are rejected in both positions', () => {
  assert.equal(canTransition('pending', 'paid'), false);
  assert.equal(canTransition('pending', 'refunded'), false);
  assert.equal(canTransition('nonsense', 'confirmed'), false);
  assert.equal(isValidStatus('paid'), false);
  assert.equal(isValidStatus('__proto__'), false);
});

test('no status can transition to itself', () => {
  for (const s of ORDER_STATUSES) {
    assert.equal(canTransition(s, s), false, `${s} -> ${s} should not be a transition`);
  }
});

test('explainTransition names what is actually reachable', () => {
  const msg = explainTransition('pending', 'delivered');
  assert.match(msg, /pending/);
  assert.match(msg, /confirmed/, 'should list the legal next states');

  assert.match(explainTransition('pending', 'bogus'), /not a valid order status/);
  assert.match(explainTransition('cancelled', 'shipped'), /terminal/);
});
