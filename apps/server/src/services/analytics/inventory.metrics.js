// ============================================
// OZOBATH - Inventory & Catalogue Metrics
// ============================================
// Stock health, capital tied up in stock, dead stock and catalogue hygiene.

const Product = require('../../models/Product');
const Order = require('../../models/Order');
const Review = require('../../models/Review');
const { bookedMatch } = require('./revenueRules');

// Matches LOW_STOCK_THRESHOLD in the product controller and the Inventory UI.
const LOW_STOCK_THRESHOLD = 10;

// No sale in this many days makes a product dead stock.
const DEAD_STOCK_DAYS = 60;

const MS_PER_DAY = 86400000;

/**
 * Stock counts plus capital tied up.
 *
 * Inventory value uses costPrice, falling back to price where cost is not
 * recorded. That overstates the figure, so `valuedAtCost` reports how many
 * products had a real cost — a value derived mostly from retail price is not
 * a cost basis and should not be presented as one.
 */
const getInventoryMetrics = async () => {
  const [buckets, valuation, deadStock] = await Promise.all([
    Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          out: { $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] } },
          low: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$stock', 0] }, { $lt: ['$stock', LOW_STOCK_THRESHOLD] }] },
                1, 0,
              ],
            },
          },
          healthy: { $sum: { $cond: [{ $gte: ['$stock', LOW_STOCK_THRESHOLD] }, 1, 0] } },
          units: { $sum: '$stock' },
        },
      },
    ]),
    Product.aggregate([
      {
        $group: {
          _id: null,
          atCost: {
            $sum: {
              $multiply: [
                { $ifNull: ['$stock', 0] },
                { $ifNull: ['$costPrice', { $ifNull: ['$price', 0] }] },
              ],
            },
          },
          atRetail: {
            $sum: { $multiply: [{ $ifNull: ['$stock', 0] }, { $ifNull: ['$price', 0] }] },
          },
          withCost: { $sum: { $cond: [{ $gt: ['$costPrice', 0] }, 1, 0] } },
        },
      },
    ]),
    getDeadStock(5),
  ]);

  const b = buckets[0] || { total: 0, out: 0, low: 0, healthy: 0, units: 0 };
  const v = valuation[0] || { atCost: 0, atRetail: 0, withCost: 0 };

  return {
    totalProducts: b.total,
    outOfStock: b.out,
    lowStock: b.low,
    healthyStock: b.healthy,
    unitsOnHand: b.units,
    inventoryValueAtCost: v.atCost,
    inventoryValueAtRetail: v.atRetail,
    // How much of the cost figure is real cost rather than retail fallback.
    valuedAtCost: v.withCost,
    deadStockCount: deadStock.length,
    deadStock,
  };
};

/**
 * Products holding stock that have not sold within DEAD_STOCK_DAYS.
 * Excludes zero-stock products: nothing is tied up in them, so they are a
 * restock question rather than a dead-capital one.
 */
const getDeadStock = async (limit = 5) => {
  const since = new Date(Date.now() - DEAD_STOCK_DAYS * MS_PER_DAY);

  const soldIds = await Order.distinct('items.product', {
    ...bookedMatch(),
    createdAt: { $gte: since },
  });

  return Product.find({
    _id: { $nin: soldIds },
    stock: { $gt: 0 },
    isActive: true,
  })
    .select('name sku stock price costPrice images')
    .sort('-stock')
    .limit(limit)
    .lean();
};

/**
 * Catalogue hygiene — issues that quietly suppress conversion and search
 * visibility. Cheap to compute, and every count links to a filtered list.
 */
const getCatalogueHealth = async () => {
  const [noImages, noDescription, noSku, noSeo, inactive, pendingReviews] = await Promise.all([
    Product.countDocuments({
      isActive: true,
      $or: [{ images: { $size: 0 } }, { images: { $exists: false } }],
    }),
    Product.countDocuments({
      isActive: true,
      $or: [{ description: { $in: [null, ''] } }, { description: { $exists: false } }],
    }),
    Product.countDocuments({
      isActive: true,
      $or: [{ sku: { $in: [null, ''] } }, { sku: { $exists: false } }],
    }),
    Product.countDocuments({
      isActive: true,
      $or: [
        { seoTitle: { $in: [null, ''] } },
        { seoTitle: { $exists: false } },
        { seoDescription: { $in: [null, ''] } },
        { seoDescription: { $exists: false } },
      ],
    }),
    Product.countDocuments({ isActive: false }),
    Review.countDocuments({ isApproved: false }),
  ]);

  return {
    missingImages: noImages,
    missingDescription: noDescription,
    missingSku: noSku,
    missingSeo: noSeo,
    inactiveProducts: inactive,
    pendingReviews,
  };
};

/**
 * Best and worst sellers for the window.
 *
 * Worst performers are the more actionable half and were previously not shown
 * anywhere: knowing what is not moving is what drives markdowns and delisting.
 */
const getProductPerformance = async ({ from, to, limit = 5 } = {}) => {
  const match = { ...bookedMatch() };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const sold = await Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        units: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { revenue: -1 } },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        units: 1,
        revenue: 1,
        name: { $ifNull: ['$product.name', 'Deleted product'] },
        sku: '$product.sku',
        stock: '$product.stock',
        image: { $arrayElemAt: ['$product.images.url', 0] },
      },
    },
  ]);

  // Active products with zero sales in the window. These never appear in a
  // sales aggregation, so they have to be found by exclusion.
  const soldIds = sold.map((s) => s._id).filter(Boolean);
  const neverSold = await Product.find({
    _id: { $nin: soldIds },
    isActive: true,
  })
    .select('name sku stock price images')
    .sort('stock')
    .limit(limit)
    .lean();

  return {
    top: sold.slice(0, limit),
    // Prefer never-sold products as "worst"; fall back to the weakest sellers.
    worst: neverSold.length
      ? neverSold.map((p) => ({
          _id: p._id,
          name: p.name,
          sku: p.sku,
          stock: p.stock,
          units: 0,
          revenue: 0,
          image: p.images?.[0]?.url,
        }))
      : sold.slice(-limit).reverse(),
  };
};

/** Revenue share by category, for the breakdown bars. */
const getCategoryPerformance = async ({ from, to, limit = 6 } = {}) => {
  const match = { ...bookedMatch() };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  return Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$product.category',
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        units: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        revenue: 1,
        units: 1,
        name: { $ifNull: ['$category.name', 'Uncategorised'] },
      },
    },
  ]);
};

module.exports = {
  getInventoryMetrics,
  getDeadStock,
  getCatalogueHealth,
  getProductPerformance,
  getCategoryPerformance,
  LOW_STOCK_THRESHOLD,
  DEAD_STOCK_DAYS,
};
