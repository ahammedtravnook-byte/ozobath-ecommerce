// ============================================
// OZOBATH - Tax Invoice Issuance
// ============================================
// Turns a paid order into a statutory tax invoice record.
//
// Two rules drive the whole design:
//
//   1. An invoice number, once allocated, is spent. GST requires a
//      consecutive series with no gaps and no reuse, so numbering goes
//      through the same atomic Counter the order numbers use, and the
//      sequence is only touched when we are certain we are issuing.
//
//   2. An invoice is issued exactly once per order. Both the browser
//      confirm path and the Razorpay webhook can mark an order paid, so
//      issuance must be idempotent — the second caller must find the
//      existing invoice, not mint a second number for the same supply.

const env = require('../config/env');
const { nextSequence } = require('../models/Counter');
const { splitTax, stateCode, financialYear } = require('../utils/gst');

// The counter is per financial year: GST numbering restarts each April, so
// 'invoice:25-26' and 'invoice:26-27' are independent series.
const counterKey = (fy) => `invoice:${fy}`;

const formatNumber = (prefix, fy, seq) =>
  `${prefix}/${fy}/${String(seq).padStart(6, '0')}`;

// Seller identity is read once per issuance and COPIED onto the order. It is
// deliberately not referenced from env at render time — an invoice must not
// change because someone edited a config file.
const sellerSnapshot = () => ({
  sellerLegalName: env.SELLER_LEGAL_NAME,
  sellerTradeName: env.SELLER_TRADE_NAME,
  sellerGstin: env.SELLER_GSTIN,
  sellerState: env.SELLER_STATE,
  sellerStateCode: env.SELLER_STATE_CODE || stateCode(env.SELLER_STATE) || '',
  sellerAddress: env.SELLER_ADDRESS,
});

// ─── Issue ───────────────────────────────────────
// Returns the order's invoice sub-document. Safe to call repeatedly: if the
// order already carries an invoice number, that invoice is returned
// unchanged and no sequence value is consumed.
//
// `session` must be passed when called inside a transaction, so a rollback
// also rolls back the number rather than burning it — same contract as
// Counter.nextSequence.
const issueInvoice = async (order, session = null) => {
  if (order.invoice?.number) return order.invoice;

  // Guard on configuration rather than silently issuing an invoice with a
  // blank GSTIN. A tax invoice without the supplier's registration number
  // is not a tax invoice, and a customer who receives one has grounds to
  // reject it. Better to fail loudly at issue time than to email 500
  // invalid documents before anyone notices.
  const seller = sellerSnapshot();
  if (!seller.sellerGstin || !seller.sellerStateCode) {
    const err = new Error(
      'Cannot issue tax invoice: SELLER_GSTIN and SELLER_STATE(_CODE) are not configured.'
    );
    err.code = 'INVOICE_NOT_CONFIGURED';
    throw err;
  }

  const issuedAt = new Date();
  const fy = financialYear(issuedAt);
  const seq = await nextSequence(counterKey(fy), session);

  const split = splitTax({
    tax: order.tax || 0,
    sellerStateCode: seller.sellerStateCode,
    buyerState: order.shippingAddress?.state,
  });

  order.invoice = {
    number: formatNumber(env.INVOICE_PREFIX, fy, seq),
    issuedAt,
    ...seller,
    ...split,
  };

  return order.invoice;
};

module.exports = {
  issueInvoice,
  formatNumber,
  counterKey,
};
