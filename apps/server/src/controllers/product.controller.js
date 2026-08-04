// ============================================
// OZOBATH - Product Controller (Full CRUD)
// ============================================
const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');
const { logActivity } = require('./activityLog.controller');
const { paginate } = require('../utils/pagination');
const { buildSearchFilter, resolveSort, sortableSet, listEnvelope } = require('../utils/listQuery');

// GET /products - List with filters, sort, pagination, search
const getProducts = asyncHandler(async (req, res) => {
  const {
    sort = '-createdAt',
    category, minPrice, maxPrice, badge,
    search, featured, rating,
  } = req.query;

  const { page, limit, skip } = paginate(req.query, { defaultLimit: 12 });

  const filter = { isActive: true };

  if (category) {
    // Support both ObjectId and slug
    if (mongoose.Types.ObjectId.isValid(category)) {
      filter.category = category;
    } else {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category = cat._id;
      else filter.category = null; // No match → return empty
    }
  }
  if (badge) filter.badges = badge;
  if (featured === 'true') filter.isFeatured = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (rating) filter.avgRating = { $gte: Number(rating) };
  if (search) filter.$text = { $search: search };

  // Map client-friendly sort to MongoDB fields
  const sortMap = {
    newest: '-createdAt',
    price_asc: 'price',
    price_desc: '-price',
    popular: '-soldCount',
    rating: '-avgRating',
  };
  // Allowlist the sort field. `sortMap[sort] || sort` passed any client
  // string through to Mongo, letting a caller sort by an unindexed field
  // (a collection scan on every request) or probe field names.
  const ALLOWED_SORTS = new Set([
    '-createdAt', 'createdAt', 'price', '-price',
    '-salesCount', '-avgRating', 'name', '-name',
  ]);
  const mapped = sortMap[sort] || sort;
  const sortField = ALLOWED_SORTS.has(mapped) ? mapped : '-createdAt';

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortField)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }, 'Products fetched');
});

// GET /products/:slug
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('relatedProducts', 'name slug price compareAtPrice images badges avgRating reviewCount');
  if (!product) throw new ApiError(404, 'Product not found.');
  sendResponse(res, 200, product, 'Product fetched');
});

// Fields an admin may set directly. Everything else on the schema —
// `salesCount`, `avgRating`, `reviewCount`, `slug` — is derived and
// maintained by the order and review paths; accepting them from the request
// let a write silently corrupt data those paths depend on.
const PRODUCT_WRITABLE = [
  'name', 'description', 'shortDescription', 'sku', 'brand',
  'price', 'compareAtPrice', 'costPrice',
  'category', 'subCategory',
  'images', 'variants', 'specifications', 'badges', 'tags',
  'stock', 'lowStockThreshold', 'trackInventory',
  'isActive', 'isFeatured',
  'freeDelivery', 'deliveryCharge',
  'weight', 'dimensions',
  'metaTitle', 'metaDescription',
  'relatedProducts',
];

const pickWritable = (body, allowed) => {
  const out = {};
  for (const key of allowed) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
};

// POST /products (Admin)
const createProduct = asyncHandler(async (req, res) => {
  const data = pickWritable(req.body, PRODUCT_WRITABLE);

  if (!data.name) throw new ApiError(400, 'Product name is required.');

  data.slug = slugify(data.name);
  const existingSlug = await Product.findOne({ slug: data.slug });
  if (existingSlug) data.slug = `${data.slug}-${Date.now()}`;

  const product = await Product.create(data);
  await logActivity(req, 'create_product', 'Product', product._id, { name: product.name, sku: product.sku });
  sendResponse(res, 201, product, 'Product created');
});

// PUT /products/:id (Admin)
const updateProduct = asyncHandler(async (req, res) => {
  const data = pickWritable(req.body, PRODUCT_WRITABLE);

  if (data.name) {
    data.slug = slugify(data.name);
    const existingSlug = await Product.findOne({ slug: data.slug, _id: { $ne: req.params.id } });
    if (existingSlug) data.slug = `${data.slug}-${Date.now()}`;
  }

  const product = await Product.findByIdAndUpdate(req.params.id, data, {
    new: true, runValidators: true,
  });
  if (!product) throw new ApiError(404, 'Product not found.');
  await logActivity(req, 'update_product', 'Product', product._id, { name: product.name, fields: Object.keys(data) });
  sendResponse(res, 200, product, 'Product updated');
});

// DELETE /products/:id (Admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');
  await logActivity(req, 'delete_product', 'Product', product._id, { name: product.name, sku: product.sku });
  sendResponse(res, 200, null, 'Product deleted');
});

// GET /products/admin/all (Admin - include inactive)
//
// Backs both the Products table and Inventory. Inventory used to request
// limit=200 and filter stock levels in the browser; MAX_LIMIT silently clamped
// that to 100, so anything past the 100th product was invisible AND
// unsearchable. stockStatus moves that filter to the database.
const ADMIN_PRODUCT_SORTS = sortableSet([
  'createdAt', 'name', 'price', 'stock', 'salesCount',
]);

// Matches the low-stock threshold the admin UI highlights in red.
const LOW_STOCK_THRESHOLD = 10;

const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const { category, status, stockStatus } = req.query;
  // Admin tables legitimately page larger than the public catalogue.
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 20, maxLimit: 200 });
  const sort = resolveSort(req.query.sort, ADMIN_PRODUCT_SORTS, '-createdAt');

  const filter = {
    ...(category && mongoose.Types.ObjectId.isValid(category) && { category }),
    ...(status === 'active' && { isActive: true }),
    ...(status === 'inactive' && { isActive: false }),
    ...(stockStatus === 'out' && { stock: { $lte: 0 } }),
    ...(stockStatus === 'low' && { stock: { $gt: 0, $lt: LOW_STOCK_THRESHOLD } }),
    ...(stockStatus === 'healthy' && { stock: { $gte: LOW_STOCK_THRESHOLD } }),
    ...buildSearchFilter(req.query.search, ['name', 'sku']),
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  // `products` is kept alongside the shared `items` key so this response stays
  // backward compatible with any caller not yet migrated.
  sendResponse(res, 200, {
    products,
    ...listEnvelope(products, total, page, limit),
  }, 'All products fetched');
});

// GET /products/admin/stock-summary
// Inventory shows healthy/low/out counts. Deriving them in the browser
// required loading every product; this counts them in the database, so the
// figures stay correct no matter how many products exist.
const getStockSummary = asyncHandler(async (req, res) => {
  const [healthy, low, out, total] = await Promise.all([
    Product.countDocuments({ stock: { $gte: LOW_STOCK_THRESHOLD } }),
    Product.countDocuments({ stock: { $gt: 0, $lt: LOW_STOCK_THRESHOLD } }),
    Product.countDocuments({ stock: { $lte: 0 } }),
    Product.countDocuments({}),
  ]);

  sendResponse(res, 200, { healthy, low, out, total }, 'Stock summary fetched');
});

// GET /products/admin/:id (Admin - fully fetch product by ID)
const getProductByIdAdmin = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('relatedProducts', 'name slug price compareAtPrice images badges avgRating reviewCount');
  if (!product) throw new ApiError(404, 'Product not found.');
  sendResponse(res, 200, product, 'Product fetched');
});

module.exports = { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, getAllProductsAdmin, getProductByIdAdmin, getStockSummary };
