// ============================================
// Tests — admin list query helpers
// ============================================
// These back every admin table. Two properties matter beyond the arithmetic:
//
//  1. `sort` reaches Mongo directly, so an unrecognised value must fall back
//     to a known-indexed field rather than being passed through — otherwise a
//     crafted query turns a table page into a full collection scan.
//  2. Search terms reach $regex, so regex metacharacters must be escaped. An
//     unescaped `(a+)+$` backtracks catastrophically inside the database.

require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildSearchFilter,
  resolveSort,
  sortableSet,
  listEnvelope,
} = require('../src/utils/listQuery');

// ─── buildSearchFilter ─────────────────────────

test('buildSearchFilter returns {} for empty input so it spreads cleanly', () => {
  assert.deepEqual(buildSearchFilter('', ['name']), {});
  assert.deepEqual(buildSearchFilter('   ', ['name']), {});
  assert.deepEqual(buildSearchFilter(undefined, ['name']), {});
  assert.deepEqual(buildSearchFilter('abc', []), {});
});

test('buildSearchFilter builds a case-insensitive $or across every field', () => {
  const filter = buildSearchFilter('shower', ['name', 'sku']);
  assert.equal(filter.$or.length, 2);
  assert.deepEqual(filter.$or[0], { name: { $regex: 'shower', $options: 'i' } });
  assert.deepEqual(filter.$or[1], { sku: { $regex: 'shower', $options: 'i' } });
});

test('buildSearchFilter escapes regex metacharacters', () => {
  // Without escaping this is a catastrophically backtracking pattern.
  const filter = buildSearchFilter('(a+)+$', ['name']);
  const pattern = filter.$or[0].name.$regex;
  assert.ok(!pattern.includes('(a+)+$'), 'raw pattern must not survive');
  assert.ok(pattern.includes('\\('), 'parenthesis should be escaped');
  // The escaped pattern must still be a valid, safe regex.
  assert.doesNotThrow(() => new RegExp(pattern));
  assert.ok(new RegExp(pattern).test('(a+)+$'), 'escaped pattern matches literally');
});

test('buildSearchFilter caps the search term length', () => {
  const filter = buildSearchFilter('x'.repeat(500), ['name']);
  assert.ok(filter.$or[0].name.$regex.length <= 100);
});

// ─── resolveSort ───────────────────────────────

test('sortableSet expands fields into both directions', () => {
  const set = sortableSet(['name', 'price']);
  assert.deepEqual([...set].sort(), ['-name', '-price', 'name', 'price']);
});

test('resolveSort accepts allowlisted values in either direction', () => {
  const set = sortableSet(['name', 'createdAt']);
  assert.equal(resolveSort('name', set, '-createdAt'), 'name');
  assert.equal(resolveSort('-name', set, '-createdAt'), '-name');
});

test('resolveSort rejects anything not allowlisted', () => {
  const set = sortableSet(['name']);
  // An unindexed or sensitive field must never reach the query.
  assert.equal(resolveSort('password', set, '-createdAt'), '-createdAt');
  assert.equal(resolveSort('{"$where":"1"}', set, '-createdAt'), '-createdAt');
  assert.equal(resolveSort('', set, '-createdAt'), '-createdAt');
  assert.equal(resolveSort(undefined, set, '-createdAt'), '-createdAt');
});

// ─── listEnvelope ──────────────────────────────

test('listEnvelope reports page count and hasMore', () => {
  const env = listEnvelope([1, 2], 45, 2, 20);
  assert.deepEqual(env.pagination, {
    page: 2, limit: 20, total: 45, pages: 3, hasMore: true,
  });
});

test('listEnvelope reports at least one page when empty', () => {
  // pages: 0 would make the frontend clamp the cursor to page 0.
  const env = listEnvelope([], 0, 1, 20);
  assert.equal(env.pagination.pages, 1);
  assert.equal(env.pagination.hasMore, false);
});

test('listEnvelope clears hasMore on the final page', () => {
  assert.equal(listEnvelope([1], 21, 2, 20).pagination.hasMore, false);
});

// Controllers spread the envelope alongside a legacy key:
//   { products, ...listEnvelope(products, ...) }
// The admin tables were left blank once because a deployed server predated
// `items` and the frontend read only that key. Both must be present, and they
// must share one array so the payload is not doubled.
test('spreading the envelope preserves the legacy key and shares the array', () => {
  const rows = [{ _id: 'a' }];
  const body = { products: rows, ...listEnvelope(rows, 1, 1, 20) };

  assert.ok(Array.isArray(body.items), 'items must be present');
  assert.ok(Array.isArray(body.products), 'legacy key must survive the spread');
  assert.equal(body.items, body.products, 'same reference — no duplicated payload');
});
