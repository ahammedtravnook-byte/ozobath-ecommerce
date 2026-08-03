// ============================================
// Regression tests — stock mutation guards
// ============================================
// Verifies the purchase path can never increase inventory and can never take
// stock below zero. Product is stubbed in require.cache so these run without
// a database.

require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// ─── Stub the Product model before utils/stock.js requires it ────
const productPath = require.resolve('../src/models/Product');

// Records every query the helper issues, and simulates MongoDB's conditional
// update semantics: a filter that does not match performs no write.
const fakeDb = { stock: 10, salesCount: 0 };
const calls = [];

require.cache[productPath] = {
  id: productPath,
  filename: productPath,
  loaded: true,
  exports: {
    findOneAndUpdate: async (filter, update) => {
      calls.push({ op: 'findOneAndUpdate', filter, update });

      // Honour the `stock: { $gte: n }` guard the way MongoDB would.
      const required = filter?.stock?.$gte;
      if (required !== undefined && fakeDb.stock < required) return null;

      fakeDb.stock += update.$inc.stock;
      fakeDb.salesCount += update.$inc.salesCount;
      return { ...fakeDb };
    },
    findByIdAndUpdate: async (id, update) => {
      calls.push({ op: 'findByIdAndUpdate', id, update });
      fakeDb.stock += update.$inc.stock;
      fakeDb.salesCount += update.$inc.salesCount;
      return { ...fakeDb };
    },
  },
};

const { decrementStock, restoreStock } = require('../src/utils/stock');

const reset = (stock = 10) => {
  fakeDb.stock = stock;
  fakeDb.salesCount = 0;
  calls.length = 0;
};

// ─── The core guarantee ──────────────────────────────────────────

test('decrementStock refuses a negative quantity instead of increasing inventory', async () => {
  reset(10);
  // Pre-fix: $inc { stock: -(-5) } = +5 — a purchase that restocked the shelf.
  await assert.rejects(
    () => decrementStock('p1', -5),
    /quantity must be a positive integer/
  );
  assert.equal(fakeDb.stock, 10, 'inventory must be untouched');
  assert.equal(calls.length, 0, 'no write should have been attempted');
});

test('decrementStock refuses fractional and zero quantities', async () => {
  reset(10);
  await assert.rejects(() => decrementStock('p1', 0.5), /positive integer/);
  await assert.rejects(() => decrementStock('p1', 0), /positive integer/);
  await assert.rejects(() => decrementStock('p1', NaN), /positive integer/);
  assert.equal(fakeDb.stock, 10);
  assert.equal(calls.length, 0);
});

test('decrementStock decrements normally when stock is sufficient', async () => {
  reset(10);
  const ok = await decrementStock('p1', 3);
  assert.equal(ok, true);
  assert.equal(fakeDb.stock, 7);
  assert.equal(fakeDb.salesCount, 3);
});

test('decrementStock never takes stock below zero', async () => {
  reset(2);
  // Pre-fix: an unconditional $inc drove stock to -3 (oversell).
  const ok = await decrementStock('p1', 5);
  assert.equal(ok, false, 'should report the shortfall');
  assert.equal(fakeDb.stock, 2, 'stock must be unchanged, not negative');
  assert.ok(fakeDb.stock >= 0);
});

test('decrementStock issues a conditional query, letting the database arbitrate', async () => {
  reset(10);
  await decrementStock('p1', 4);
  const [call] = calls;
  assert.equal(call.op, 'findOneAndUpdate');
  assert.deepEqual(call.filter.stock, { $gte: 4 }, 'the floor must be in the query filter');
  assert.equal(call.update.$inc.stock, -4, 'stock must decrease');
  assert.ok(call.update.$inc.stock < 0, 'a purchase must never increase stock');
});

test('concurrent decrements cannot oversell', async () => {
  reset(5);
  // Three racing checkouts for 2 units each against 5 in stock: at most two
  // can succeed. The conditional filter is what makes the third fail.
  const results = await Promise.all([
    decrementStock('p1', 2),
    decrementStock('p1', 2),
    decrementStock('p1', 2),
  ]);
  const succeeded = results.filter(Boolean).length;
  assert.equal(succeeded, 2, 'exactly two of three should succeed');
  assert.ok(fakeDb.stock >= 0, `stock must not go negative, got ${fakeDb.stock}`);
  assert.equal(fakeDb.stock, 1);
});

// ─── Restore path ────────────────────────────────────────────────

test('restoreStock returns inventory on cancellation', async () => {
  reset(7);
  await restoreStock('p1', 3);
  assert.equal(fakeDb.stock, 10);
  assert.equal(fakeDb.salesCount, -3);
});

test('restoreStock refuses a negative quantity, so a cancellation cannot decrement', async () => {
  reset(7);
  await assert.rejects(() => restoreStock('p1', -3), /positive integer/);
  assert.equal(fakeDb.stock, 7);
});
