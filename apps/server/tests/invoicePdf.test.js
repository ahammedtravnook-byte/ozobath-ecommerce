require('./helpers/env');

const { test } = require('node:test');
const assert = require('node:assert');

const { renderInvoicePdf, money } = require('../src/services/invoicePdf.service');

const baseOrder = (overrides = {}) => ({
  orderNumber: 'OZO-000123',
  paymentMethod: 'razorpay',
  paymentStatus: 'paid',
  shippingAddress: {
    fullName: 'Ahammed', line1: '12 MG Road', line2: 'Indiranagar',
    city: 'Bengaluru', state: 'Karnataka', pincode: '560038',
    phone: '+91 98450 00000',
  },
  items: [
    { name: 'OZObath Shower Kit', price: 899, quantity: 2, hsn: '3922' },
    { name: 'Glass Enclosure', variant: '6mm', price: 12000, quantity: 1 },
  ],
  subtotal: 13798,
  taxableValue: 13798,
  shippingCost: 0,
  discount: 0,
  tax: 2483.64,
  taxRate: 0.18,
  taxMode: 'exclusive',
  total: 16281.64,
  invoice: {
    number: 'LAQUA/25-26/000001',
    issuedAt: new Date('2026-08-04T10:00:00Z'),
    sellerLegalName: 'Laqua Elite',
    sellerGstin: '29ABCDE1234F1Z5',
    sellerState: 'Karnataka',
    sellerStateCode: '29',
    sellerAddress: 'Bengaluru, Karnataka',
    placeOfSupply: 'Karnataka',
    placeOfSupplyCode: '29',
    taxType: 'cgst_sgst',
    cgst: 1241.82,
    sgst: 1241.82,
    igst: 0,
  },
  ...overrides,
});

// ─── Output shape ────────────────────────────────

test('renders a non-empty PDF buffer', async () => {
  const buf = await renderInvoicePdf(baseOrder());

  assert.ok(Buffer.isBuffer(buf));
  assert.ok(buf.length > 800, `expected a real document, got ${buf.length} bytes`);
  assert.equal(buf.subarray(0, 5).toString(), '%PDF-', 'must carry the PDF magic bytes');
  assert.ok(buf.subarray(-1024).includes(Buffer.from('%%EOF')), 'must be terminated');
});

test('renders an IGST invoice', async () => {
  const order = baseOrder({
    shippingAddress: { ...baseOrder().shippingAddress, state: 'Kerala' },
    invoice: {
      ...baseOrder().invoice,
      taxType: 'igst', cgst: 0, sgst: 0, igst: 2483.64,
      placeOfSupply: 'Kerala', placeOfSupplyCode: '32',
    },
  });

  const buf = await renderInvoicePdf(order);
  assert.ok(buf.length > 800);
});

// ─── Guard ───────────────────────────────────────

test('refuses to render when no invoice was issued', async () => {
  const order = baseOrder({ invoice: undefined });

  await assert.rejects(
    () => renderInvoicePdf(order),
    (err) => err.code === 'INVOICE_NOT_ISSUED',
    'must not fabricate a tax invoice for an unissued order'
  );
});

test('refuses to render when the invoice has no number', async () => {
  const order = baseOrder({ invoice: { taxType: 'igst', igst: 10 } });

  await assert.rejects(
    () => renderInvoicePdf(order),
    (err) => err.code === 'INVOICE_NOT_ISSUED'
  );
});

// ─── Robustness ──────────────────────────────────

test('renders with a missing shipping address', async () => {
  // The webhook path can create an order before any address is supplied.
  const buf = await renderInvoicePdf(baseOrder({ shippingAddress: undefined }));
  assert.ok(buf.length > 800);
});

test('renders with no items without throwing', async () => {
  const buf = await renderInvoicePdf(baseOrder({ items: [] }));
  assert.ok(buf.length > 800);
});

test('paginates a long item list', async () => {
  const many = Array.from({ length: 60 }, (_, i) => ({
    name: `Product line item number ${i + 1}`,
    price: 100 + i, quantity: 1, hsn: '3922',
  }));

  const buf = await renderInvoicePdf(baseOrder({ items: many }));
  assert.ok(buf.length > 2000, 'a 60-line invoice should span pages');
});

// ─── Currency formatting ─────────────────────────

test('money uses Rs. — the built-in PDF fonts have no rupee glyph', () => {
  assert.equal(money(1234.5), 'Rs. 1234.50');
  assert.equal(money(0), 'Rs. 0.00');
  assert.equal(money(undefined), 'Rs. 0.00');
  assert.ok(!money(99).includes('₹'), 'U+20B9 would render as a wrong glyph');
});
