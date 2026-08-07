// ============================================
// OZOBATH - Video Tour Routes
// ============================================
const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const VideoTour = require('../models/VideoTour');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { parseVideoUrl } = require('../utils/videoUrl');

const adminOnly = [auth, roleGuard('admin', 'superadmin')];

// Fields an admin may set. req.body is otherwise passed straight to the
// model, which would let a crafted request write provider/videoId/embedUrl
// directly and bypass URL validation.
const WRITABLE = ['title', 'description', 'url', 'duration', 'placement', 'order', 'isActive', 'thumbnail'];

const pick = (body = {}) =>
  Object.fromEntries(Object.entries(body).filter(([k]) => WRITABLE.includes(k)));

// ─── Public: active tours for a placement ────────
router.get('/', asyncHandler(async (req, res) => {
  const { placement = 'home-hero' } = req.query;

  const tours = await VideoTour.find({ placement, isActive: true })
    .select('title description provider videoId embedUrl thumbnail duration order')
    .sort('order createdAt')
    .lean();

  sendResponse(res, 200, tours, 'Video tours fetched');
}));

// ─── Admin: all tours ────────────────────────────
router.get('/admin/all', ...adminOnly, asyncHandler(async (req, res) => {
  const tours = await VideoTour.find().sort('order createdAt').lean();
  sendResponse(res, 200, tours, 'All video tours fetched');
}));

// ─── Admin: create ───────────────────────────────
router.post('/', ...adminOnly, asyncHandler(async (req, res) => {
  const data = pick(req.body);

  if (!data.url || !parseVideoUrl(data.url)) {
    throw new ApiError(400, 'Paste a valid YouTube or Vimeo link.');
  }

  const tour = await VideoTour.create(data);
  sendResponse(res, 201, tour, 'Video tour created');
}));

// ─── Admin: update ───────────────────────────────
router.put('/:id', ...adminOnly, asyncHandler(async (req, res) => {
  const data = pick(req.body);

  if (data.url && !parseVideoUrl(data.url)) {
    throw new ApiError(400, 'Paste a valid YouTube or Vimeo link.');
  }

  const tour = await VideoTour.findById(req.params.id);
  if (!tour) throw new ApiError(404, 'Video tour not found');

  // Assign and save() rather than findByIdAndUpdate: the pre('validate') hook
  // that derives provider/videoId/embedUrl does not run on update queries, so
  // changing the URL through findByIdAndUpdate would leave the embed pointing
  // at the previous video.
  Object.assign(tour, data);
  await tour.save();

  sendResponse(res, 200, tour, 'Video tour updated');
}));

// ─── Admin: reorder ──────────────────────────────
// Declared before /:id so "reorder" is not captured as an id.
router.patch('/reorder', ...adminOnly, asyncHandler(async (req, res) => {
  const { orders } = req.body; // [{ id, order }]
  if (!Array.isArray(orders) || !orders.length) {
    throw new ApiError(400, 'orders array required');
  }

  await VideoTour.bulkWrite(
    orders.map((o) => ({
      updateOne: { filter: { _id: o.id }, update: { order: Number(o.order) || 0 } },
    }))
  );

  sendResponse(res, 200, null, 'Video tours reordered');
}));

// ─── Admin: delete ───────────────────────────────
router.delete('/:id', ...adminOnly, asyncHandler(async (req, res) => {
  const tour = await VideoTour.findByIdAndDelete(req.params.id);
  if (!tour) throw new ApiError(404, 'Video tour not found');
  sendResponse(res, 200, null, 'Video tour deleted');
}));

module.exports = router;
