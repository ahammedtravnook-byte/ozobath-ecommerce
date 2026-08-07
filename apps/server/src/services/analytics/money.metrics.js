// ============================================
// OZOBATH - Money Metrics
// ============================================
// Revenue, AOV, discounts, cancellations and the COD/prepaid split.
// Every figure is derived from revenueRules, so the recognition policy lives
// in exactly one place.

const Order = require('../../models/Order');
const {
  bookedMatch, cancelledMatch, collectedMatch, dateRangeMatch,
  revenueGroup, emptyRevenue, averageOrderValue, rate,
} = require('./revenueRules');

/**
 * Headline money figures for a window.
 * Runs the four aggregations concurrently — they are independent, and doing
 * them in series made the dashboard the slowest screen in the admin.
 */
const getMoneyMetrics = async ({ from, to } = {}) => {
  const range = dateRangeMatch(from, to);

  const [bookedRows, collectedRows, cancelledRows, methodRows] = await Promise.all([
    Order.aggregate([
      { $match: { ...bookedMatch(), ...range } },
      { $group: revenueGroup() },
    ]),
    Order.aggregate([
      { $match: { ...bookedMatch(), ...collectedMatch(), ...range } },
      { $group: { _id: null, net: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { ...cancelledMatch(), ...range } },
      { $group: { _id: null, net: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { ...bookedMatch(), ...range } },
      {
        $group: {
          _id: { $ifNull: ['$paymentMethod', 'unknown'] },
          net: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
    ]),
  ]);

  const booked = { ...emptyRevenue(), ...(bookedRows[0] || {}) };
  const collected = collectedRows[0] || { net: 0, orders: 0 };
  const cancelled = cancelledRows[0] || { net: 0, orders: 0 };

  // COD vs prepaid, as share of booked revenue. Anything not literally 'cod'
  // is prepaid — new gateways should not silently vanish from this split.
  const cod = methodRows.find((r) => r._id === 'cod') || { net: 0, orders: 0 };
  const prepaidNet = methodRows
    .filter((r) => r._id !== 'cod')
    .reduce((sum, r) => sum + r.net, 0);
  const prepaidOrders = methodRows
    .filter((r) => r._id !== 'cod')
    .reduce((sum, r) => sum + r.orders, 0);

  // Denominator includes cancelled: the cancellation rate is a share of all
  // orders placed, not of the ones that survived.
  const totalPlaced = booked.orders + cancelled.orders;

  return {
    netRevenue: booked.net,
    grossRevenue: booked.gross,
    collectedRevenue: collected.net,
    // What is booked but not yet banked — the COD exposure.
    outstandingRevenue: booked.net - collected.net,
    orders: booked.orders,
    itemsSold: booked.items,
    averageOrderValue: averageOrderValue(booked.net, booked.orders),
    discountTotal: booked.discount,
    discountRate: rate(booked.discount, booked.gross),
    taxTotal: booked.tax,
    shippingTotal: booked.shipping,
    cancelledOrders: cancelled.orders,
    cancelledValue: cancelled.net,
    cancellationRate: rate(cancelled.orders, totalPlaced),
    paymentSplit: {
      cod: { net: cod.net, orders: cod.orders, share: rate(cod.net, booked.net) },
      prepaid: { net: prepaidNet, orders: prepaidOrders, share: rate(prepaidNet, booked.net) },
    },
  };
};

/**
 * Daily buckets for the trend chart.
 *
 * Zero-fills every day in the range. Without this the chart silently omits
 * quiet days and draws a straight line between the days that had orders,
 * which reads as steady trade rather than a gap.
 */
const getRevenueTimeseries = async ({ from, to }) => {
  const rows = await Order.aggregate([
    { $match: { ...bookedMatch(), ...dateRangeMatch(from, to) } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byDay = new Map(rows.map((r) => [r._id, r]));
  const series = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    const hit = byDay.get(key);
    const revenue = hit?.revenue || 0;
    const orders = hit?.orders || 0;
    series.push({
      date: key,
      revenue,
      orders,
      aov: orders > 0 ? revenue / orders : 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return series;
};

module.exports = { getMoneyMetrics, getRevenueTimeseries };
