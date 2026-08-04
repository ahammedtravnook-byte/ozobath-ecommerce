require('./helpers/env');

// Seller identity must exist before invoice.service reads config/env.
process.env.SELLER_LEGAL_NAME = 'Laqua Elite';
process.env.SELLER_GSTIN = '29ABCDE1234F1Z5';
process.env.SELLER_STATE = 'Karnataka';
process.env.SELLER_STATE_CODE = '29';
process.env.SELLER_ADDRESS = 'Bengaluru, Karnataka';
process.env.INVOICE_PREFIX = 'LAQUA';

const { test } = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');

// Stub the Counter model: these tests are about issuance logic, not Mongo.
// The stub mimics the atomic increment contract — each call returns a new,
// strictly increasing value per key.
const sequences = new Map();
let sequenceCalls = 0;

const originalResolve = Module._resolveFilename;
const counterPath = require.resolve('../src/models/Counter');
require.cache[counterPath] = {
  id: counterPath,
  filename: counterPath,
  loaded: true,
  exports: {
    nextSequence: async (name) => {
      sequenceCalls += 1;
      const next = (sequences.get(name) || 0) + 1;
      sequences.set(name, next);
      return next;
    },
  },
};

const { issueInvoice } = require('../src/services/invoice.service');

const makeOrder = (overrides = {}) => ({
  tax: 180,
  shippingAddress: { state: 'Karnataka' },
  ...overrides,
});

const reset = () => {
  sequences.clear();
  sequenceCalls = 0;
};

// ─── Numbering ───────────────────────────────────

test('invoice number carries prefix, financial year and a padded sequence', async () => {
  reset();
  const order = makeOrder();
  const inv = await issueInvoice(order);

  assert.match(inv.number, /^LAQUA\/\d{2}-\d{2}\/000001$/);
});

test('numbers increment without gaps', async () => {
  reset();
  const a = await issueInvoice(makeOrder());
  const b = await issueInvoice(makeOrder());
  const c = await issueInvoice(makeOrder());

  const seq = (n) => Number(n.number.split('/')[2]);
  assert.equal(seq(a), 1);
  assert.equal(seq(b), 2);
  assert.equal(seq(c), 3);
});

// ─── Idempotency ─────────────────────────────────
// The browser confirm path and the Razorpay webhook can both mark one order
// paid. A second issuance would mint a second number for the same supply and
// leave a gap in the series.

test('re-issuing an order returns the existing invoice', async () => {
  reset();
  const order = makeOrder();

  const first = await issueInvoice(order);
  const second = await issueInvoice(order);

  assert.equal(second.number, first.number);
  assert.equal(second.issuedAt, first.issuedAt);
});

test('re-issuing consumes no sequence value', async () => {
  reset();
  const order = makeOrder();

  await issueInvoice(order);
  const afterFirst = sequenceCalls;
  await issueInvoice(order);

  assert.equal(sequenceCalls, afterFirst, 'second call must not touch the counter');
});

// ─── Tax split ───────────────────────────────────

test('buyer in the seller state gets CGST and SGST', async () => {
  reset();
  const inv = await issueInvoice(makeOrder({ shippingAddress: { state: 'Karnataka' } }));

  assert.equal(inv.taxType, 'cgst_sgst');
  assert.equal(inv.cgst, 90);
  assert.equal(inv.sgst, 90);
  assert.equal(inv.igst, 0);
});

test('buyer outside the seller state gets IGST', async () => {
  reset();
  const inv = await issueInvoice(makeOrder({ shippingAddress: { state: 'Kerala' } }));

  assert.equal(inv.taxType, 'igst');
  assert.equal(inv.igst, 180);
  assert.equal(inv.placeOfSupply, 'Kerala');
});

// ─── Frozen snapshot ─────────────────────────────

test('seller identity is copied onto the invoice, not referenced', async () => {
  reset();
  const order = makeOrder();
  const inv = await issueInvoice(order);

  assert.equal(inv.sellerGstin, '29ABCDE1234F1Z5');
  assert.equal(inv.sellerLegalName, 'Laqua Elite');

  // Changing config afterwards must not rewrite an issued invoice.
  process.env.SELLER_GSTIN = '27ZZZZZ9999Z9Z9';
  assert.equal(order.invoice.sellerGstin, '29ABCDE1234F1Z5');
  process.env.SELLER_GSTIN = '29ABCDE1234F1Z5';
});

// ─── Configuration guard ─────────────────────────

test('refuses to issue when the GSTIN is not configured', async () => {
  reset();

  // Re-require the service with the seller cleared, so the guard is
  // exercised against a genuinely unconfigured environment.
  const envPath = require.resolve('../src/config/env');
  const svcPath = require.resolve('../src/services/invoice.service');
  const savedGstin = process.env.SELLER_GSTIN;

  delete require.cache[envPath];
  delete require.cache[svcPath];
  process.env.SELLER_GSTIN = '';

  const { issueInvoice: guarded } = require(svcPath);

  await assert.rejects(
    () => guarded(makeOrder()),
    (err) => err.code === 'INVOICE_NOT_CONFIGURED',
    'an invoice without a GSTIN is not a tax invoice and must not be issued'
  );

  process.env.SELLER_GSTIN = savedGstin;
  delete require.cache[envPath];
  delete require.cache[svcPath];
});

test('module resolution was left untouched', () => {
  assert.equal(Module._resolveFilename, originalResolve);
});
