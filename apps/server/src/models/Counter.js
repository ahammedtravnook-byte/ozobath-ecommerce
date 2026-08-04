// ============================================
// OZOBATH - Atomic Sequence Counters
// ============================================
// Order numbers were generated with `countDocuments() + 1`: a read-then-write
// on a field with a unique index. Two concurrent checkouts both read the same
// count and both attempted the same number — one got a duplicate-key error,
// and in the confirm path that error was misread as a duplicate payment,
// failing an order the customer had already paid for.
//
// `countDocuments` also decreases when orders are deleted, so numbers could
// be reused.
//
// findOneAndUpdate with $inc is atomic in MongoDB: concurrent callers are
// serialised by the server and each receives a distinct value.

const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },   // sequence name, e.g. 'order'
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

// `session` must be passed when called inside a transaction — otherwise the
// counter increment happens outside it and survives a rollback, silently
// burning order numbers on every failed checkout.
const nextSequence = async (name, session = null) => {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true, ...(session ? { session } : {}) }
  );
  return counter.seq;
};

// Seed the counter above the highest existing order number, so an existing
// database does not restart numbering at 1 and collide with historic orders.
// Idempotent: only raises the counter, never lowers it. Called once at boot.
const seedOrderCounter = async () => {
  const Order = mongoose.model('Order');
  const latest = await Order.findOne({ orderNumber: { $exists: true, $ne: null } })
    .sort({ orderNumber: -1 })
    .select('orderNumber')
    .lean();

  if (!latest?.orderNumber) return;

  const parsed = parseInt(String(latest.orderNumber).replace(/\D/g, ''), 10);
  if (!Number.isFinite(parsed)) return;

  const existing = await Counter.findById('order').lean();
  if (existing && existing.seq >= parsed) return;

  await Counter.findByIdAndUpdate(
    'order',
    { $set: { seq: parsed } },
    { upsert: true }
  );
  console.log(`✅ Order counter seeded to ${parsed} (highest existing: ${latest.orderNumber})`);
};

module.exports = { Counter, nextSequence, seedOrderCounter };
