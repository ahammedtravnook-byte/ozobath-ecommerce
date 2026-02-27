// ============================================
// OZOBATH - Banner Controller (Full CRUD)
// ============================================
const Banner = require('../models/Banner');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getBanners = asyncHandler(async (req, res) => {
  const { page = 'home', position } = req.query;
  const filter = { isActive: true, page };
  if (position) filter.position = position;

  const now = new Date();
  filter.$or = [
    { startDate: null, endDate: null },
    { startDate: { $lte: now }, endDate: { $gte: now } },
    { startDate: { $lte: now }, endDate: null },
    { startDate: null, endDate: { $gte: now } },
  ];

  const banners = await Banner.find(filter).sort('order').lean();
  sendResponse(res, 200, banners, 'Banners fetched');
});

const getAllBannersAdmin = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort('-createdAt').lean();
  sendResponse(res, 200, banners, 'All banners fetched');
});

const createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  sendResponse(res, 201, banner, 'Banner created');
});

const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!banner) throw new ApiError(404, 'Banner not found.');
  sendResponse(res, 200, banner, 'Banner updated');
});

const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw new ApiError(404, 'Banner not found.');
  sendResponse(res, 200, null, 'Banner deleted');
});

module.exports = { getBanners, getAllBannersAdmin, createBanner, updateBanner, deleteBanner };
