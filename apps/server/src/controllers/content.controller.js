// ============================================
// OZOBATH - Dynamic Content Controller ★ CMS Core
// ============================================
const DynamicContent = require('../models/DynamicContent');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// GET /content/:page — Public: Get all active sections for a page
const getPageContent = asyncHandler(async (req, res) => {
  const { page } = req.params;

  const now = new Date();
  const content = await DynamicContent.find({
    page,
    isActive: true,
    $or: [
      { startDate: { $exists: false } },
      { startDate: null },
      { startDate: { $lte: now } },
    ],
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gte: now } },
    ],
  }).sort('order').lean();

  sendResponse(res, 200, content, `Content for ${page} fetched`);
});

// GET /content — Admin: Get all content with filtering
const getAllContent = asyncHandler(async (req, res) => {
  const { page, section } = req.query;
  const filter = {};
  if (page) filter.page = page;
  if (section) filter.section = section;

  const content = await DynamicContent.find(filter).sort('page order').populate('updatedBy', 'name email').lean();
  sendResponse(res, 200, content, 'All content fetched');
});

// POST /content — Admin: Create new section content
const createContent = asyncHandler(async (req, res) => {
  req.body.updatedBy = req.user._id;

  const maxOrder = await DynamicContent.findOne({ page: req.body.page }).sort('-order').select('order').lean();
  if (!req.body.order) req.body.order = (maxOrder?.order || 0) + 1;

  const content = await DynamicContent.create(req.body);
  sendResponse(res, 201, content, 'Content section created');
});

// PUT /content/:id — Admin: Update section content
const updateContent = asyncHandler(async (req, res) => {
  req.body.updatedBy = req.user._id;

  const content = await DynamicContent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!content) throw new ApiError(404, 'Content section not found.');
  sendResponse(res, 200, content, 'Content updated');
});

// DELETE /content/:id — Admin
const deleteContent = asyncHandler(async (req, res) => {
  const content = await DynamicContent.findByIdAndDelete(req.params.id);
  if (!content) throw new ApiError(404, 'Content section not found.');
  sendResponse(res, 200, null, 'Content deleted');
});

// PUT /content/reorder/:page — Admin: Reorder sections
const reorderContent = asyncHandler(async (req, res) => {
  const { sections } = req.body; // [{ id, order }]
  if (!sections || !Array.isArray(sections)) {
    throw new ApiError(400, 'Sections array with id and order required.');
  }

  const ops = sections.map((s) => ({
    updateOne: {
      filter: { _id: s.id },
      update: { order: s.order },
    },
  }));

  await DynamicContent.bulkWrite(ops);
  sendResponse(res, 200, null, 'Sections reordered');
});

module.exports = { getPageContent, getAllContent, createContent, updateContent, deleteContent, reorderContent };
