// ============================================
// OZOBATH - Instagram Reel Routes
// ============================================
const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const InstagramReel = require('../models/InstagramReel');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// ─── Public: Get active reels ────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const reels = await InstagramReel.find({ isActive: true })
    .populate('linkedProducts', 'name slug price images')
    .sort('order')
    .lean();
  sendResponse(res, 200, reels, 'Reels fetched');
}));

// ─── Admin: Get all reels ────────────────────────
router.get('/admin/all', auth, roleGuard('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const reels = await InstagramReel.find()
    .populate('linkedProducts', 'name slug price images')
    .sort('order')
    .lean();
  sendResponse(res, 200, reels, 'All reels fetched');
}));

// ─── Admin: Create reel ──────────────────────────
router.post('/', auth, roleGuard('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const reel = await InstagramReel.create(req.body);
  sendResponse(res, 201, reel, 'Reel created');
}));

// ─── Admin: Update reel ──────────────────────────
router.put('/:id', auth, roleGuard('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const reel = await InstagramReel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!reel) throw new ApiError(404, 'Reel not found');
  sendResponse(res, 200, reel, 'Reel updated');
}));

// ─── Admin: Delete reel ──────────────────────────
router.delete('/:id', auth, roleGuard('admin', 'superadmin'), asyncHandler(async (req, res) => {
  await InstagramReel.findByIdAndDelete(req.params.id);
  sendResponse(res, 200, null, 'Reel deleted');
}));

// ─── Admin: Reorder reels ────────────────────────
router.patch('/reorder', auth, roleGuard('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const { reelOrders } = req.body; // [{ id, order }]
  if (!Array.isArray(reelOrders)) throw new ApiError(400, 'reelOrders array required');

  const bulkOps = reelOrders.map(r => ({
    updateOne: {
      filter: { _id: r.id },
      update: { order: r.order },
    },
  }));
  await InstagramReel.bulkWrite(bulkOps);
  sendResponse(res, 200, null, 'Reels reordered');
}));

module.exports = router;
