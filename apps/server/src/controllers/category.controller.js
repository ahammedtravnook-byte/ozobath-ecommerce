// ============================================
// OZOBATH - Category Controller (Full CRUD)
// ============================================
const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('order').lean();
  sendResponse(res, 200, categories, 'Categories fetched');
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });
  if (!category) throw new ApiError(404, 'Category not found.');
  sendResponse(res, 200, category, 'Category fetched');
});

const createCategory = asyncHandler(async (req, res) => {
  req.body.slug = slugify(req.body.name);
  const existing = await Category.findOne({ slug: req.body.slug });
  if (existing) throw new ApiError(409, 'Category with this name already exists.');

  const category = await Category.create(req.body);
  sendResponse(res, 201, category, 'Category created');
});

const updateCategory = asyncHandler(async (req, res) => {
  if (req.body.name) req.body.slug = slugify(req.body.name);

  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) throw new ApiError(404, 'Category not found.');
  sendResponse(res, 200, category, 'Category updated');
});

const deleteCategory = asyncHandler(async (req, res) => {
  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) throw new ApiError(400, `Cannot delete. ${productCount} products are linked to this category.`);

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  sendResponse(res, 200, null, 'Category deleted');
});

const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('order').lean();

  const catsWithCount = await Promise.all(
    categories.map(async (cat) => ({
      ...cat,
      productCount: await Product.countDocuments({ category: cat._id }),
    }))
  );

  sendResponse(res, 200, catsWithCount, 'All categories fetched');
});

module.exports = { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory, getAllCategoriesAdmin };
