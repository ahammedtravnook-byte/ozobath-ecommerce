// ============================================
// OZOBATH - Dashboard Assembly
// ============================================
// Composes the metric modules into one payload, adding period-over-period
// deltas. Kept separate from the controller so the same figures can back a
// scheduled report or an export without going through HTTP.

const { resolveRange } = require('./dateRange');
const { getMoneyMetrics, getRevenueTimeseries } = require('./money.metrics');
const { getCustomerMetrics, getTopCustomers } = require('./customer.metrics');
const { getFulfilmentMetrics, getCycleTimes } = require('./fulfilment.metrics');
const {
  getInventoryMetrics, getCatalogueHealth,
  getProductPerformance, getCategoryPerformance,
} = require('./inventory.metrics');
const { percentChange } = require('./revenueRules');
const Order = require('../../models/Order');
const B2BEnquiry = require('../../models/B2BEnquiry');

/**
 * Pair a current and previous value into the shape the KPI tiles consume.
 * `change` is null when the baseline was zero — the UI renders that as "new"
 * rather than a misleading +0% or +∞%.
 */
const delta = (current, previous) => ({
  value: current,
  previous,
  change: percentChange(current, previous),
});

const getDashboard = async (query = {}) => {
  const range = resolveRange(query);

  // Current and previous windows run concurrently; neither depends on the
  // other, and in series this was the slowest screen in the admin.
  const [
    money, prevMoney,
    customers, prevCustomers,
    timeseries, prevTimeseries,
    fulfilment, cycleTimes,
    inventory, catalogue,
    products, categories,
    topCustomers, recentOrders, newEnquiries,
  ] = await Promise.all([
    getMoneyMetrics({ from: range.from, to: range.to }),
    getMoneyMetrics({ from: range.previousFrom, to: range.previousTo }),
    getCustomerMetrics({ from: range.from, to: range.to }),
    getCustomerMetrics({ from: range.previousFrom, to: range.previousTo }),
    getRevenueTimeseries({ from: range.from, to: range.to }),
    getRevenueTimeseries({ from: range.previousFrom, to: range.previousTo }),
    getFulfilmentMetrics(),
    getCycleTimes({ from: range.from, to: range.to }),
    getInventoryMetrics(),
    getCatalogueHealth(),
    getProductPerformance({ from: range.from, to: range.to, limit: 5 }),
    getCategoryPerformance({ from: range.from, to: range.to, limit: 6 }),
    getTopCustomers(5),
    Order.find().sort('-createdAt').limit(6)
      .populate('user', 'name email')
      .select('orderNumber total status paymentMethod paymentStatus createdAt shippingAddress.city')
      .lean(),
    B2BEnquiry.countDocuments({ status: 'new' }),
  ]);

  return {
    range: {
      key: range.key,
      from: range.from,
      to: range.to,
      previousFrom: range.previousFrom,
      previousTo: range.previousTo,
      days: range.days,
    },

    // Flat map of metric id -> { value, previous, change }. The frontend
    // widget registry looks metrics up by id, so adding a KPI tile is a
    // config change here plus one entry there — no component edits.
    metrics: {
      netRevenue: delta(money.netRevenue, prevMoney.netRevenue),
      grossRevenue: delta(money.grossRevenue, prevMoney.grossRevenue),
      collectedRevenue: delta(money.collectedRevenue, prevMoney.collectedRevenue),
      outstandingRevenue: delta(money.outstandingRevenue, prevMoney.outstandingRevenue),
      orders: delta(money.orders, prevMoney.orders),
      averageOrderValue: delta(money.averageOrderValue, prevMoney.averageOrderValue),
      itemsSold: delta(money.itemsSold, prevMoney.itemsSold),
      discountTotal: delta(money.discountTotal, prevMoney.discountTotal),
      discountRate: delta(money.discountRate, prevMoney.discountRate),
      cancelledOrders: delta(money.cancelledOrders, prevMoney.cancelledOrders),
      cancelledValue: delta(money.cancelledValue, prevMoney.cancelledValue),
      cancellationRate: delta(money.cancellationRate, prevMoney.cancellationRate),
      activeBuyers: delta(customers.activeBuyers, prevCustomers.activeBuyers),
      newBuyers: delta(customers.newBuyers, prevCustomers.newBuyers),
      returningBuyers: delta(customers.returningBuyers, prevCustomers.returningBuyers),
      repeatPurchaseRate: delta(customers.repeatPurchaseRate, prevCustomers.repeatPurchaseRate),
      newSignups: delta(customers.newSignups, prevCustomers.newSignups),

      // Point-in-time figures: a backlog has no meaningful "previous period".
      awaitingFulfilment: delta(fulfilment.awaitingFulfilment, null),
      overdueShipments: delta(fulfilment.overdueShipments, null),
      failedPayments: delta(fulfilment.failedPayments, null),
      lowStock: delta(inventory.lowStock, null),
      outOfStock: delta(inventory.outOfStock, null),
      inventoryValueAtCost: delta(inventory.inventoryValueAtCost, null),
      deadStockCount: delta(inventory.deadStockCount, null),
      pendingReviews: delta(catalogue.pendingReviews, null),
      newEnquiries: delta(newEnquiries, null),
      hoursToShip: delta(cycleTimes.hoursToShip, null),
      hoursToDeliver: delta(cycleTimes.hoursToDeliver, null),
      totalCustomers: delta(customers.totalCustomers, null),
      totalProducts: delta(inventory.totalProducts, null),
    },

    paymentSplit: money.paymentSplit,
    statusDistribution: fulfilment.statusDistribution,
    catalogueHealth: catalogue,

    series: {
      current: timeseries,
      previous: prevTimeseries,
    },

    lists: {
      recentOrders,
      topProducts: products.top,
      worstProducts: products.worst,
      topCustomers,
      categories,
      deadStock: inventory.deadStock,
    },

    // Drives the "Needs action" strip. Only non-zero entries are emitted, so
    // a healthy store shows an empty bar rather than a row of zeros.
    needsAction: [
      { id: 'fulfil', label: 'Orders to fulfil', count: fulfilment.awaitingFulfilment, to: '/orders?status=confirmed' },
      { id: 'overdue', label: 'Overdue shipments', count: fulfilment.overdueShipments, to: '/orders?status=confirmed' },
      { id: 'payments', label: 'Payments failed', count: fulfilment.failedPayments, to: '/orders?paymentStatus=failed' },
      { id: 'lowstock', label: 'Low on stock', count: inventory.lowStock, to: '/inventory?stockStatus=low' },
      { id: 'outstock', label: 'Out of stock', count: inventory.outOfStock, to: '/inventory?stockStatus=out' },
      { id: 'reviews', label: 'Reviews to moderate', count: catalogue.pendingReviews, to: '/reviews' },
      { id: 'enquiries', label: 'New enquiries', count: newEnquiries, to: '/enquiries?status=new' },
      { id: 'seo', label: 'Missing SEO fields', count: catalogue.missingSeo, to: '/products' },
      { id: 'images', label: 'Missing images', count: catalogue.missingImages, to: '/products' },
    ].filter((a) => a.count > 0),
  };
};

module.exports = { getDashboard };
