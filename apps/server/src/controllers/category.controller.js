// ============================================
// OZOBATH - Category Controller (Full CRUD)
// ============================================
const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { paginate } = require('../utils/pagination');
const { buildSearchFilter, resolveSort, sortableSet, listEnvelope } = require('../utils/listQuery');

// req.body after validate() middleware — already allowlisted and coerced.
// Named so it is obvious at the call site that this is not raw input.
const validated = (req) => req.body;
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

  const category = await Category.create(validated(req));
  sendResponse(res, 201, category, 'Category created');
});

const updateCategory = asyncHandler(async (req, res) => {
  if (req.body.name) req.body.slug = slugify(req.body.name);

  const category = await Category.findByIdAndUpdate(req.params.id, validated(req), { new: true, runValidators: true });
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

// GET /categories/admin/all — paginated, searchable, sortable.
//
// Two problems with the previous version: it returned every category with no
// pagination, and it issued one countDocuments() per category (N+1). With 6
// categories that is 7 round trips; the $lookup below is one.
const CATEGORY_SORTS = sortableSet(['order', 'name', 'createdAt', 'productCount']);

const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 20, maxLimit: 200 });
  const sort = resolveSort(req.query.sort, CATEGORY_SORTS, 'order');
  const { status } = req.query;

  const filter = {
    ...(status === 'active' && { isActive: true }),
    ...(status === 'inactive' && { isActive: false }),
    ...buildSearchFilter(req.query.search, ['name', 'slug', 'description']),
  };

  // Translate "-name" into { name: -1 } for the aggregation stage.
  const direction = sort.startsWith('-') ? -1 : 1;
  const sortStage = { [sort.replace(/^-/, '')]: direction };

  const [rows, total] = await Promise.all([
    Category.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'linkedProducts',
        },
      },
      { $addFields: { productCount: { $size: '$linkedProducts' } } },
      { $project: { linkedProducts: 0 } },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
    ]),
    Category.countDocuments(filter),
  ]);

  sendResponse(
    res,
    200,
    listEnvelope(rows, total, page, limit),
    'All categories fetched'
  );
});

module.exports = { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory, getAllCategoriesAdmin };
