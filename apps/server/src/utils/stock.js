// ============================================
// OZOBATH - Stock Mutation Guards
// ============================================
// The purchase paths decrement stock with a raw `$inc: { stock: -quantity }`.
// `findByIdAndUpdate` does not run Mongoose validators, so the `min: 0` on
// Product.stock never fires — the operator is trusted completely. That gives
// two failure modes this module closes:
//
//   1. A negative quantity flips the sign and INCREASES inventory during a
//      purchase, while decrementing salesCount.
//   2. Concurrent checkouts each read stock, both pass their own check, and
//      both decrement — driving stock below zero (oversell).
//
// Both are handled by making the decrement conditional in the query itself,
// so MongoDB arbitrates rather than the application.

const Product = require('../models/Product');

// Atomically decrement stock, refusing to increase it or take it below zero.
//
// `quantity` must be a positive integer — anything else is a programming
// error upstream and throws rather than silently mutating inventory.
//
// Returns true if stock was decremented, false if there was not enough stock
// (no write occurred). Callers on the post-payment path deliberately do not
// treat false as fatal: the customer has already been charged, so the order
// stands and the shortfall is surfaced for manual fulfilment rather than
// stranding their money.
const decrementStock = async (productId, quantity, session = null) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error(
      `decrementStock: quantity must be a positive integer, got ${quantity}`
    );
  }

  // The `stock: { $gte: quantity }` filter is the floor. If another request
  // consumed the stock first, this matches nothing and writes nothing.
  const result = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity, salesCount: quantity } },
    { new: true, ...(session ? { session } : {}) }
  );

  if (!result) {
    console.warn(
      `[stock] Insufficient stock to decrement product ${productId} by ${quantity}; inventory not adjusted.`
    );
    return false;
  }

  return true;
};

// Restore stock on cancellation. Separated from decrementStock so the sign is
// explicit at the call site and a cancellation can never be made to decrement.
const restoreStock = async (productId, quantity, session = null) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error(
      `restoreStock: quantity must be a positive integer, got ${quantity}`
    );
  }

  await Product.findByIdAndUpdate(
    productId,
    { $inc: { stock: quantity, salesCount: -quantity } },
    session ? { session } : {}
  );
};

module.exports = { decrementStock, restoreStock };
