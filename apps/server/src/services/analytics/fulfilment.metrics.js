// ============================================
// OZOBATH - Fulfilment Metrics
// ============================================
// Backlog, overdue shipments and cycle times.

const Order = require('../../models/Order');
const { dateRangeMatch } = require('./revenueRules');

// An order confirmed more than this many days ago and still not shipped is
// treated as overdue. Change here, not at the call sites.
const OVERDUE_AFTER_DAYS = 2;

const MS_PER_DAY = 86400000;
const MS_PER_HOUR = 3600000;

/**
 * Operational snapshot. Deliberately NOT windowed by date: a backlog is
 * whatever is outstanding right now, regardless of when it was placed. An
 * order stuck since last month is exactly the one worth surfacing.
 */
const getFulfilmentMetrics = async () => {
  const overdueBefore = new Date(Date.now() - OVERDUE_AFTER_DAYS * MS_PER_DAY);

  const [awaiting, overdue, failedPayments, statusRows] = await Promise.all([
    Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'processing'] } }),
    Order.countDocuments({
      status: { $in: ['confirmed', 'processing'] },
      createdAt: { $lt: overdueBefore },
    }),
    Order.countDocuments({ paymentStatus: 'failed' }),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$total' } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const statusDistribution = {};
  statusRows.forEach((r) => {
    statusDistribution[r._id || 'unknown'] = { count: r.count, value: r.value };
  });

  return { awaitingFulfilment: awaiting, overdueShipments: overdue, failedPayments, statusDistribution };
};

/**
 * Average hours from order → shipped and order → delivered.
 *
 * Derived from statusHistory rather than a stored duration, so it stays
 * correct for orders that skip states. `deliveredAt` is preferred when
 * present because it is set explicitly on delivery; statusHistory is the
 * fallback for older records.
 *
 * Returns null when there is nothing to measure — a dash in the UI is honest,
 * where "0 hrs" would read as instant fulfilment.
 */
const getCycleTimes = async ({ from, to } = {}) => {
  const rows = await Order.aggregate([
    { $match: { ...dateRangeMatch(from, to), 'statusHistory.0': { $exists: true } } },
    {
      $project: {
        createdAt: 1,
        deliveredAt: 1,
        shippedAt: {
          $min: {
            $map: {
              input: {
                $filter: {
                  input: '$statusHistory',
                  as: 'h',
                  cond: { $eq: ['$$h.status', 'shipped'] },
                },
              },
              as: 'h',
              in: '$$h.date',
            },
          },
        },
        historyDeliveredAt: {
          $min: {
            $map: {
              input: {
                $filter: {
                  input: '$statusHistory',
                  as: 'h',
                  cond: { $eq: ['$$h.status', 'delivered'] },
                },
              },
              as: 'h',
              in: '$$h.date',
            },
          },
        },
      },
    },
  ]);

  const shipDurations = [];
  const deliverDurations = [];

  for (const row of rows) {
    const placed = row.createdAt?.getTime();
    if (!placed) continue;

    if (row.shippedAt) {
      const d = row.shippedAt.getTime() - placed;
      if (d >= 0) shipDurations.push(d);
    }

    const delivered = row.deliveredAt || row.historyDeliveredAt;
    if (delivered) {
      const d = delivered.getTime() - placed;
      if (d >= 0) deliverDurations.push(d);
    }
  }

  const meanHours = (list) =>
    list.length ? list.reduce((a, b) => a + b, 0) / list.length / MS_PER_HOUR : null;

  return {
    hoursToShip: meanHours(shipDurations),
    hoursToDeliver: meanHours(deliverDurations),
    shippedSample: shipDurations.length,
    deliveredSample: deliverDurations.length,
  };
};

module.exports = { getFulfilmentMetrics, getCycleTimes, OVERDUE_AFTER_DAYS };
