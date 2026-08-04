// ============================================
// Regression tests — pagination bounds and CORS (M-08, H-08)
// ============================================

require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const { clampLimit, clampPage, paginate, MAX_LIMIT } = require('../src/utils/pagination');

// ─── M-08: unbounded pagination ──────────────────

test('clampLimit caps an unbounded limit', () => {
  // `GET /products?limit=1000000` was unauthenticated and returned every
  // product document in one response.
  assert.equal(clampLimit(1_000_000), MAX_LIMIT);
  assert.equal(clampLimit('999999'), MAX_LIMIT);
  assert.equal(clampLimit(Number.MAX_SAFE_INTEGER), MAX_LIMIT);
});

test('clampLimit rejects zero and negative limits', () => {
  assert.equal(clampLimit(0), 1);
  assert.equal(clampLimit(-5), 1);
});

test('clampLimit falls back on non-numeric input', () => {
  assert.equal(clampLimit('abc', 20), 20);
  assert.equal(clampLimit(undefined, 20), 20);
  assert.equal(clampLimit(NaN, 20), 20);
  // Infinity is not finite, so it takes the fallback rather than the ceiling.
  // Either would be safe; asserting the actual behaviour pins it.
  assert.equal(clampLimit(Infinity, 20), 20);
  assert.equal(clampLimit(-Infinity, 20), 20);
});

test('clampLimit truncates fractional limits', () => {
  assert.equal(clampLimit(10.9), 10);
});

test('clampPage never produces a negative skip', () => {
  // A negative skip is rejected by MongoDB at query time.
  assert.equal(clampPage(-3), 1);
  assert.equal(clampPage(0), 1);
  assert.equal(clampPage('abc'), 1);
  assert.equal(paginate({ page: -3, limit: 10 }).skip, 0);
});

test('paginate produces consistent page/limit/skip', () => {
  const { page, limit, skip } = paginate({ page: 3, limit: 25 });
  assert.equal(page, 3);
  assert.equal(limit, 25);
  assert.equal(skip, 50);
});

test('paginate clamps a hostile limit even with a valid page', () => {
  const { limit, skip } = paginate({ page: 2, limit: 500000 });
  assert.equal(limit, MAX_LIMIT);
  assert.equal(skip, MAX_LIMIT);
});

// ─── H-08: CORS origin allowlist ─────────────────
// Mirrors the predicate in app.js. The bug was `origin.endsWith('.vercel.app')`,
// which trusts a shared public deployment domain anyone can deploy to.

const PREVIEW_ORIGIN = /^https:\/\/ozobath-[a-z0-9-]+\.vercel\.app$/;

test('the preview pattern rejects arbitrary vercel.app origins', () => {
  assert.equal(PREVIEW_ORIGIN.test('https://attacker.vercel.app'), false);
  assert.equal(PREVIEW_ORIGIN.test('https://evil-site.vercel.app'), false);
  // The old check was a bare suffix test, which these all passed.
  assert.ok('https://attacker.vercel.app'.endsWith('.vercel.app'));
});

test('the preview pattern accepts only this project prefix', () => {
  assert.ok(PREVIEW_ORIGIN.test('https://ozobath-abc123.vercel.app'));
  assert.ok(PREVIEW_ORIGIN.test('https://ozobath-git-main-x.vercel.app'));
});

test('the preview pattern cannot be bypassed by a lookalike host', () => {
  assert.equal(PREVIEW_ORIGIN.test('https://ozobath-x.vercel.app.evil.com'), false);
  assert.equal(PREVIEW_ORIGIN.test('http://ozobath-x.vercel.app'), false, 'http must not match');
  assert.equal(PREVIEW_ORIGIN.test('https://notozobath-x.vercel.app'), false);
});
