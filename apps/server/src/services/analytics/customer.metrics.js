// ============================================
// OZOBATH - Customer Metrics
// ============================================
// New vs returning, repeat rate, lifetime value.

const Order = require('../../models/Order');
const User = require('../../models/User');
const { bookedMatch, dateRangeMatch, rate } = require('./revenueRules');

/**
 * "Returning" is decided by whether the customer had a booked order BEFORE
 * the window opened — not by their order count inside it. Someone placing
 * their first two orders this week is one new customer, not one new and one
 * returning.
 */
const getCustomerMetrics = async ({ from, to } = {}) => {
  const range = dateRangeMatch(from, to);

  const [buyersInWindow, priorBuyerIds, newSignups, totalCustomers] = await Promise.all([
    Order.aggregate([
      { $match: { ...bookedMatch(), ...range } },
      { $group: { _id: '$user', orders: { $sum: 1 }, spend: { $sum: '$total' } } },
    ]),
    from
      ? Order.distinct('user', { ...bookedMatch(), createdAt: { $lt: new Date(from) } })
      : Promise.resolve([]),
    User.countDocuments({ role: 'customer', ...dateRangeMatch(from, to) }),
    User.countDocuments({ role: 'customer' }),
  ]);

  const priorSet = new Set(priorBuyerIds.map(String));
  const returning = buyersInWindow.filter((b) => priorSet.has(String(b._id)));
  const fresh = buyersInWindow.filter((b) => !priorSet.has(String(b._id)));

  return {
    activeBuyers: buyersInWindow.length,
    newBuyers: fresh.length,
    returningBuyers: returning.length,
    repeatPurchaseRate: rate(returning.length, buyersInWindow.length),
    newSignups,
    totalCustomers,
    revenueFromReturning: returning.reduce((s, b) => s + b.spend, 0),
    revenueFromNew: fresh.reduce((s, b) => s + b.spend, 0),
  };
};

/**
 * Top customers by lifetime spend — deliberately all-time, not windowed.
 * "Best customer this week" is noise; LTV is the actionable ranking.
 */
const getTopCustomers = async (limit = 5) => {
  const rows = await Order.aggregate([
    { $match: bookedMatch() },
    {
      $group: {
        _id: '$user',
        lifetimeValue: { $sum: '$total' },
        orders: { $sum: 1 },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
    { $sort: { lifetimeValue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'customer',
      },
    },
    { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        lifetimeValue: 1,
        orders: 1,
        lastOrderAt: 1,
        name: { $ifNull: ['$customer.name', 'Deleted customer'] },
        email: '$customer.email',
      },
    },
  ]);

  return rows;
};

module.exports = { getCustomerMetrics, getTopCustomers };
