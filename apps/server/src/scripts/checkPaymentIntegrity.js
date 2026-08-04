// ============================================
// OZOBATH - Payment Integrity Check
// ============================================
// Run before deploying the idempotency fix, and periodically afterwards.
//
//   node src/scripts/checkPaymentIntegrity.js
//
// Checks:
//   1. Duplicate razorpayOrderId values. These BLOCK the unique index from
//      building — Mongoose logs the failure and carries on, so you can end up
//      believing you have idempotency protection when you do not. Any
//      duplicates must be reconciled by hand before the index will build.
//   2. Whether the unique index is actually present on the live collection.
//   3. Paid Razorpay orders missing a payment id — a sign of the
//      browser-died-mid-confirm gap.

require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');

const run = async () => {
    await mongoose.connect(env.MONGODB_URI);
    const orders = mongoose.connection.collection('orders');

    let problems = 0;

    // ─── 1. Duplicate razorpayOrderId ─────────────
    const dupes = await orders.aggregate([
        { $match: { razorpayOrderId: { $ne: null } } },
        { $group: { _id: '$razorpayOrderId', count: { $sum: 1 }, orders: { $push: '$orderNumber' } } },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
    ]).toArray();

    if (dupes.length === 0) {
        console.log('✅ No duplicate razorpayOrderId values.');
    } else {
        problems += dupes.length;
        console.log(`❌ ${dupes.length} Razorpay order(s) mapped to multiple DB orders:`);
        for (const d of dupes) {
            console.log(`   ${d._id}  →  ${d.count} orders: ${d.orders.join(', ')}`);
        }
        console.log('   These must be reconciled before the unique index can build.');
        console.log('   Each group represents ONE payment that produced MULTIPLE orders.');
    }

    // ─── 2. Is the unique index live? ─────────────
    const indexes = await orders.indexes();
    const uniqueIdx = indexes.find(
        (i) => i.key && i.key.razorpayOrderId === 1 && i.unique
    );
    console.log(
        uniqueIdx
            ? '✅ Unique index on razorpayOrderId is present.'
            : '❌ Unique index on razorpayOrderId is MISSING — replays are not blocked.'
    );
    if (!uniqueIdx) problems += 1;

    // ─── 3. Paid orders with no payment id ────────
    const orphaned = await orders.countDocuments({
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        $or: [{ razorpayPaymentId: null }, { razorpayPaymentId: { $exists: false } }],
    });
    console.log(
        orphaned === 0
            ? '✅ All paid Razorpay orders carry a payment id.'
            : `⚠️  ${orphaned} paid Razorpay order(s) have no payment id.`
    );

    await mongoose.disconnect();
    console.log(problems === 0 ? '\nAll checks passed.' : `\n${problems} issue(s) need attention.`);
    process.exit(problems === 0 ? 0 : 1);
};

run().catch((err) => {
    console.error('Check failed:', err.message);
    process.exit(1);
});
