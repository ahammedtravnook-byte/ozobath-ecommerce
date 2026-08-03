// ============================================
// OZOBATH - Line Item Quantity Validation
// ============================================
// One definition of what a valid quantity is, shared by every cart write path.
//
// The model-level `min: 1` on Cart/Order/PendingCheckout already blocks a
// negative quantity, but it is a backstop, not a business rule: it permits
// fractional quantities (0.5 halves the line total and reaches the payment
// gateway as a genuine discount) and has no upper bound. Both are enforced
// here, at the entry point, before anything is written.

const env = require('../config/env');

// Coerce a client-supplied quantity to a valid integer, or return null.
// Accepts numbers and numeric strings; rejects NaN, Infinity, fractions,
// zero, negatives, and anything above MAX_ORDER_QUANTITY.
//
// Returns the normalised integer, or null if the input is not a valid
// quantity. Callers decide whether that is a 400 or a skipped line.
const parseQuantity = (value) => {
  const n = typeof value === 'string' ? Number(value) : value;

  if (typeof n !== 'number') return null;
  if (!Number.isInteger(n)) return null;   // rejects NaN, Infinity and fractions
  if (n < 1) return null;
  if (n > env.MAX_ORDER_QUANTITY) return null;

  return n;
};

const quantityErrorMessage = () =>
  `Quantity must be a whole number between 1 and ${env.MAX_ORDER_QUANTITY}.`;

module.exports = { parseQuantity, quantityErrorMessage };
