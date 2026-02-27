// ============================================
// OZOBATH - Product Controller (Full CRUD)
// ============================================
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');

// GET /products - List with filters, sort, pagination, search
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12, sort = '-createdAt',
    category, minPrice, maxPrice, badge,
    search, featured, rating,
  } = req.query;

  const filter = { isActive: true };

  if (category) filter.category = category;
  if (badge) filter.badges = badge;
  if (featured === 'true') filter.isFeatured = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (rating) filter.avgRating = { $gte: Number(rating) };
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    products,
    pagination: {
      page: Number(page), limit: Number(limit), total,
      pages: Math.ceil(total / Number(limit)),
    },
  }, 'Products fetched');
});

// GET /products/:slug
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found.');
  sendResponse(res, 200, product, 'Product fetched');
});

// POST /products (Admin)
const createProduct = asyncHandler(async (req, res) => {
  req.body.slug = slugify(req.body.name);

  const existingSlug = await Product.findOne({ slug: req.body.slug });
  if (existingSlug) req.body.slug = `${req.body.slug}-${Date.now()}`;

  const product = await Product.create(req.body);
  sendResponse(res, 201, product, 'Product created');
});

// PUT /products/:id (Admin)
const updateProduct = asyncHandler(async (req, res) => {
  if (req.body.name) {
    req.body.slug = slugify(req.body.name);
    const existingSlug = await Product.findOne({ slug: req.body.slug, _id: { $ne: req.params.id } });
    if (existingSlug) req.body.slug = `${req.body.slug}-${Date.now()}`;
  }

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!product) throw new ApiError(404, 'Product not found.');
  sendResponse(res, 200, product, 'Product updated');
});

// DELETE /products/:id (Admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');
  sendResponse(res, 200, null, 'Product deleted');
});

// GET /products/admin/all (Admin - include inactive)
const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, category, status } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { sku: { $regex: search, $options: 'i' } },
  ];

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
    Product.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    products,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  }, 'All products fetched');
});

module.exports = { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, getAllProductsAdmin };
