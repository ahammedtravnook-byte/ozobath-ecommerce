// ============================================
// Tests — revenue recognition and dashboard ranges
// ============================================
// Every dashboard figure, report and export derives from these rules, so the
// policy is pinned explicitly. The specific failure being guarded against:
// the dashboard previously summed { paymentStatus: 'paid' }, which in a
// COD-dominant business reported ₹0 against real orders worth ₹33,032.

require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  BOOKED_STATUSES,
  EXCLUDED_STATUSES,
  bookedMatch,
  cancelledMatch,
  collectedMatch,
  dateRangeMatch,
  averageOrderValue,
  percentChange,
  rate,
} = require('../src/services/analytics/revenueRules');

const { resolveRange } = require('../src/services/analytics/dateRange');

// ─── Recognition policy ────────────────────────

test('booked revenue includes COD orders that have not been collected', () => {
  // The whole point: a COD parcel in transit is booked revenue.
  assert.ok(BOOKED_STATUSES.includes('pending'));
  assert.ok(BOOKED_STATUSES.includes('shipped'));
  assert.ok(BOOKED_STATUSES.includes('delivered'));
});

test('cancelled and returned orders are never booked', () => {
  for (const s of EXCLUDED_STATUSES) {
    assert.ok(!BOOKED_STATUSES.includes(s), `${s} must not be booked`);
  }
});

test('booked and cancelled matchers are disjoint', () => {
  const booked = new Set(bookedMatch().status.$in);
  for (const s of cancelledMatch().status.$in) {
    assert.ok(!booked.has(s), `${s} appears in both matchers`);
  }
});

test('collected revenue requires payment for prepaid, delivery for COD', () => {
  const clauses = collectedMatch().$or;
  const prepaid = clauses.find((c) => c.paymentMethod?.$ne === 'cod');
  const cod = clauses.find((c) => c.paymentMethod === 'cod');

  assert.equal(prepaid.paymentStatus, 'paid');
  assert.deepEqual(cod.status.$in, ['delivered']);
});

// ─── Date range fragments ──────────────────────

test('dateRangeMatch returns {} when unbounded so it spreads cleanly', () => {
  assert.deepEqual(dateRangeMatch(null, null), {});
  assert.deepEqual(dateRangeMatch(undefined, undefined), {});
});

test('dateRangeMatch accepts a single bound', () => {
  const from = new Date('2026-01-01');
  assert.deepEqual(dateRangeMatch(from, null), { createdAt: { $gte: from } });
  assert.deepEqual(dateRangeMatch(null, from), { createdAt: { $lte: from } });
});

// ─── Arithmetic guards ─────────────────────────

test('averageOrderValue does not divide by zero', () => {
  assert.equal(averageOrderValue(0, 0), 0);
  assert.equal(averageOrderValue(1000, 0), 0);
  assert.equal(averageOrderValue(1000, 4), 250);
});

test('percentChange returns null when there is no baseline', () => {
  // null means "new", which the UI renders as a dash. Returning 0 would claim
  // no change; returning Infinity would render as garbage.
  assert.equal(percentChange(500, 0), null);
  assert.equal(percentChange(0, 0), 0);
});

test('percentChange handles growth and decline', () => {
  assert.equal(percentChange(150, 100), 50);
  assert.equal(percentChange(50, 100), -50);
});

test('rate does not divide by zero', () => {
  assert.equal(rate(5, 0), 0);
  assert.equal(rate(1, 4), 25);
});

// ─── Range resolution ──────────────────────────

test('the comparison window is the same length as the selection', () => {
  for (const key of ['today', '7d', '30d', '90d']) {
    const r = resolveRange({ range: key });
    const current = r.to - r.from;
    const previous = r.previousTo - r.previousFrom;
    // Both windows must span the same duration, or the delta is meaningless.
    assert.ok(Math.abs(current - previous) < 1000, `${key}: window lengths differ`);
  }
});

test('the comparison window ends immediately before the selection starts', () => {
  const r = resolveRange({ range: '7d' });
  assert.equal(r.previousTo.getTime(), r.from.getTime() - 1);
});

test('an unknown range key falls back to 30d rather than erroring', () => {
  assert.equal(resolveRange({ range: 'nonsense' }).key, '30d');
});

test('a custom range with unparseable bounds falls back to 30d', () => {
  // An Invalid Date reaching Mongo matches nothing, which would render as
  // "no orders" rather than an error — worse than falling back.
  const r = resolveRange({ range: 'custom', from: 'not-a-date', to: 'also-not' });
  assert.ok(r.from instanceof Date && !Number.isNaN(r.from.getTime()));
  assert.ok(r.days >= 29 && r.days <= 31);
});

test('a valid custom range is honoured', () => {
  const r = resolveRange({ range: 'custom', from: '2026-01-01', to: '2026-01-31' });
  assert.equal(r.from.getDate(), 1);
  assert.equal(r.to.getDate(), 31);
  // End of day, so orders placed on the final day are included.
  assert.equal(r.to.getHours(), 23);
});
