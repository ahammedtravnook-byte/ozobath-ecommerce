// ============================================
// OZOBATH - GST Split & Place of Supply
// ============================================
// A GST invoice may not print a single "tax" figure. The same 18% is either
// CGST 9% + SGST 9% (supplier and recipient in one state) or IGST 18%
// (different states), and the two are legally distinct heads that must be
// shown on separate lines.
//
// Which one applies is decided by the PLACE OF SUPPLY. For goods delivered
// to a customer, that is the delivery address state (IGST Act s.10(1)(a)) —
// not the billing address, and not where the customer happens to live.
//
// This module only decides the split. The tax AMOUNT is computed upstream in
// calculateTotals.js and passed in, so there is exactly one place that knows
// how tax is derived from a cart.

// GST state codes — the first two digits of every GSTIN. The state name on a
// shipping address is free text typed by a customer, so it is normalised
// against this table rather than compared directly.
const STATE_CODES = {
  'jammu and kashmir': '01', 'himachal pradesh': '02', 'punjab': '03',
  'chandigarh': '04', 'uttarakhand': '05', 'haryana': '06', 'delhi': '07',
  'rajasthan': '08', 'uttar pradesh': '09', 'bihar': '10', 'sikkim': '11',
  'arunachal pradesh': '12', 'nagaland': '13', 'manipur': '14',
  'mizoram': '15', 'tripura': '16', 'meghalaya': '17', 'assam': '18',
  'west bengal': '19', 'jharkhand': '20', 'odisha': '21', 'chhattisgarh': '22',
  'madhya pradesh': '23', 'gujarat': '24', 'dadra and nagar haveli and daman and diu': '26',
  'maharashtra': '27', 'karnataka': '29', 'goa': '30', 'lakshadweep': '31',
  'kerala': '32', 'tamil nadu': '33', 'puducherry': '34',
  'andaman and nicobar islands': '35', 'telangana': '36',
  'andhra pradesh': '37', 'ladakh': '38', 'other territory': '97',
};

// Common spellings and older names customers still type.
const ALIASES = {
  'orissa': 'odisha',
  'pondicherry': 'puducherry',
  'new delhi': 'delhi',
  'nct of delhi': 'delhi',
  'j&k': 'jammu and kashmir',
  'tamilnadu': 'tamil nadu',
  'andaman and nicobar': 'andaman and nicobar islands',
  'daman and diu': 'dadra and nagar haveli and daman and diu',
  'dadra and nagar haveli': 'dadra and nagar haveli and daman and diu',
};

const normalise = (state) =>
  String(state || '')
    .toLowerCase()
    .replace(/[.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// Returns the two-digit GST code for a state name, or null if unrecognised.
const stateCode = (state) => {
  const key = normalise(state);
  if (!key) return null;
  const canonical = ALIASES[key] || key;
  return STATE_CODES[canonical] || null;
};

// ─── The split ───────────────────────────────────
// `tax` is the total GST in rupees, already computed by calculateTotals.
// `sellerStateCode` is the supplier's registered state (from env).
// `buyerState` is the shipping address state.
//
// When the buyer's state cannot be recognised we fall back to IGST. That is
// the safer error: IGST is a single head payable to the centre, so an
// unrecognised state produces an invoice that is still valid on its face,
// whereas guessing CGST+SGST would assert an intra-state supply that may
// not have happened.
const splitTax = ({ tax, sellerStateCode, buyerState }) => {
  const buyerCode = stateCode(buyerState);
  const intraState = Boolean(sellerStateCode) && buyerCode === sellerStateCode;

  if (intraState) {
    // Split in halves. Round the first and subtract, so cgst + sgst is
    // exactly `tax` — halving an odd paise figure twice and rounding both
    // would drift the invoice total away from the amount actually charged.
    const cgst = Math.round((tax / 2) * 100) / 100;
    const sgst = Math.round((tax - cgst) * 100) / 100;
    return {
      taxType: 'cgst_sgst',
      cgst,
      sgst,
      igst: 0,
      placeOfSupply: buyerState || '',
      placeOfSupplyCode: buyerCode,
    };
  }

  return {
    taxType: 'igst',
    cgst: 0,
    sgst: 0,
    igst: tax,
    placeOfSupply: buyerState || '',
    placeOfSupplyCode: buyerCode,
  };
};

// ─── Financial year ──────────────────────────────
// GST invoice numbering restarts each financial year, which in India runs
// April to March. An order placed in March 2026 belongs to 25-26; one placed
// that April belongs to 26-27.
const financialYear = (date = new Date()) => {
  const y = date.getFullYear();
  const startYear = date.getMonth() >= 3 ? y : y - 1; // getMonth: 0=Jan, 3=Apr
  return `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
};

// A GSTIN is 15 characters: 2 state + 10 PAN + 1 entity + 'Z' + 1 checksum.
const isValidGstin = (gstin) =>
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(String(gstin || '').toUpperCase());

module.exports = {
  STATE_CODES,
  stateCode,
  splitTax,
  financialYear,
  isValidGstin,
};
