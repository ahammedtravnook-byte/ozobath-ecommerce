// ============================================
// OZOBATH - Optional Transaction Wrapper
// ============================================
// Order creation performs several independent writes — claim coupon, create
// order, consume snapshot, decrement stock, clear cart. A crash between any
// two left permanently inconsistent state: a burned coupon with no order, an
// order whose stock was never decremented, a cart still holding items the
// customer just bought.
//
// MongoDB transactions require a replica set. Atlas provides one; a plain
// standalone `mongod` does not, and calling startSession().withTransaction()
// there throws. Rather than make transactions a hard deployment requirement,
// this detects support once and degrades to sequential execution — which is
// exactly the previous behaviour, so a standalone deployment is no worse off
// than before while a replica-set deployment gets atomicity.

const mongoose = require('mongoose');

// null = not yet probed. Cached after the first attempt so we do not pay for
// a failed session on every checkout.
let transactionsSupported = null;

const runWithTransaction = async (fn) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

// Execute `fn` inside a transaction when the deployment supports one.
// `fn` receives the session (or null) and must pass it to every write.
const withTransaction = async (fn) => {
  if (transactionsSupported === false) return fn(null);

  try {
    const result = await runWithTransaction(fn);
    if (transactionsSupported === null) {
      transactionsSupported = true;
      console.log('✅ MongoDB transactions available — order writes are atomic.');
    }
    return result;
  } catch (err) {
    // Only the specific "this deployment has no transactions" errors count.
    // A duplicate-key error (11000) or any application error must propagate
    // unchanged — misclassifying one as "unsupported" would silently re-run
    // the whole body non-atomically and could double-apply its writes.
    const unsupported =
      /Transaction numbers are only allowed on a replica set/i.test(err.message || '') ||
      /Transactions are not supported/i.test(err.message || '') ||
      /Current topology does not support sessions/i.test(err.message || '') ||
      err.code === 20 ||
      (err.codeName === 'IllegalOperation' && /transaction/i.test(err.message || ''));

    if (unsupported && transactionsSupported === null) {
      transactionsSupported = false;
      console.warn(
        '⚠️  MongoDB transactions unavailable (standalone deployment). Order writes will run ' +
        'sequentially and are NOT atomic — a crash mid-checkout can leave inconsistent state. ' +
        'Use a replica set in production.'
      );
      return fn(null);
    }

    // A genuine application error inside the transaction — propagate it.
    throw err;
  }
};

module.exports = { withTransaction };
