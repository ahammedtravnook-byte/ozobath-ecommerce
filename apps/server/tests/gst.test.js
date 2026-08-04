require('./helpers/env');

const { test } = require('node:test');
const assert = require('node:assert');

const { stateCode, splitTax, financialYear, isValidGstin } = require('../src/utils/gst');

// ─── State codes ─────────────────────────────────

test('resolves a state name to its GST code', () => {
  assert.equal(stateCode('Karnataka'), '29');
  assert.equal(stateCode('Kerala'), '32');
  assert.equal(stateCode('Maharashtra'), '27');
});

test('state matching ignores case, spacing and punctuation', () => {
  assert.equal(stateCode('  karnataka  '), '29');
  assert.equal(stateCode('TAMIL NADU'), '33');
  assert.equal(stateCode('tamilnadu'), '33');
});

test('older state names still resolve', () => {
  assert.equal(stateCode('Orissa'), stateCode('Odisha'));
  assert.equal(stateCode('Pondicherry'), stateCode('Puducherry'));
});

test('an unknown state returns null rather than guessing', () => {
  assert.equal(stateCode('Atlantis'), null);
  assert.equal(stateCode(''), null);
  assert.equal(stateCode(undefined), null);
});

// ─── The split ───────────────────────────────────

test('same state splits into CGST and SGST', () => {
  const r = splitTax({ tax: 180, sellerStateCode: '29', buyerState: 'Karnataka' });
  assert.equal(r.taxType, 'cgst_sgst');
  assert.equal(r.cgst, 90);
  assert.equal(r.sgst, 90);
  assert.equal(r.igst, 0);
});

test('different state produces IGST only', () => {
  const r = splitTax({ tax: 180, sellerStateCode: '29', buyerState: 'Kerala' });
  assert.equal(r.taxType, 'igst');
  assert.equal(r.igst, 180);
  assert.equal(r.cgst, 0);
  assert.equal(r.sgst, 0);
});

test('cgst + sgst always equals the tax charged, including odd amounts', () => {
  // 162.01 halves to 81.005 — rounding both halves up would bill 162.02 and
  // the invoice would disagree with the amount taken from the customer.
  for (const tax of [162.01, 0.01, 99.99, 1234.57]) {
    const r = splitTax({ tax, sellerStateCode: '29', buyerState: 'Karnataka' });
    assert.equal(
      Math.round((r.cgst + r.sgst) * 100) / 100,
      Math.round(tax * 100) / 100,
      `split of ${tax} must sum back to ${tax}`
    );
  }
});

test('an unrecognised buyer state falls back to IGST', () => {
  const r = splitTax({ tax: 180, sellerStateCode: '29', buyerState: 'Atlantis' });
  assert.equal(r.taxType, 'igst');
  assert.equal(r.igst, 180);
});

test('a missing seller state code falls back to IGST', () => {
  // Before the GSTIN is configured, no supply can be proven intra-state.
  const r = splitTax({ tax: 180, sellerStateCode: '', buyerState: 'Karnataka' });
  assert.equal(r.taxType, 'igst');
  assert.equal(r.igst, 180);
});

test('zero tax splits to zero under both heads', () => {
  const r = splitTax({ tax: 0, sellerStateCode: '29', buyerState: 'Karnataka' });
  assert.equal(r.cgst, 0);
  assert.equal(r.sgst, 0);
  assert.equal(r.igst, 0);
});

test('place of supply records the buyer state', () => {
  const r = splitTax({ tax: 180, sellerStateCode: '29', buyerState: 'Kerala' });
  assert.equal(r.placeOfSupply, 'Kerala');
  assert.equal(r.placeOfSupplyCode, '32');
});

// ─── Financial year ──────────────────────────────

test('financial year runs April to March', () => {
  assert.equal(financialYear(new Date('2026-04-01')), '26-27');
  assert.equal(financialYear(new Date('2026-03-31')), '25-26');
  assert.equal(financialYear(new Date('2026-01-15')), '25-26');
  assert.equal(financialYear(new Date('2025-12-31')), '25-26');
});

// ─── GSTIN validation ────────────────────────────

test('accepts a well-formed GSTIN and rejects malformed ones', () => {
  assert.equal(isValidGstin('29ABCDE1234F1Z5'), true);
  assert.equal(isValidGstin('29abcde1234f1z5'), true, 'case is normalised');
  assert.equal(isValidGstin('29ABCDE1234F1X5'), false, '12th char must be Z');
  assert.equal(isValidGstin('29ABCDE1234F1Z'), false, 'too short');
  assert.equal(isValidGstin(''), false);
  assert.equal(isValidGstin(undefined), false);
});
