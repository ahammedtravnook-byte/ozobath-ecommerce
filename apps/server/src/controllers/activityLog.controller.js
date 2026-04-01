// ============================================
// OZOBATH - Admin Activity Log Controller
// ============================================
const AdminActivityLog = require('../models/AdminActivityLog');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── Helper: Log an admin action ────────────
// Call this from any admin controller
const logActivity = async (req, action, resource, resourceId, details = {}) => {
  try {
    await AdminActivityLog.create({
      user: req.user._id,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    });
  } catch (err) {
    // Non-critical — never throw, just warn
    console.warn('[ActivityLog] Failed to write log:', err.message);
  }
};

// ─── GET /admin/activity-logs ────────────────
const getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, resource, action, userId } = req.query;
  const filter = {};
  if (resource) filter.resource = resource;
  if (action) filter.action = { $regex: action, $options: 'i' };
  if (userId) filter.user = userId;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [logs, total] = await Promise.all([
    AdminActivityLog.find(filter)
      .populate('user', 'name email role')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    AdminActivityLog.countDocuments(filter),
  ]);

  sendResponse(res, 200, { logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }, 'Activity logs fetched');
});

module.exports = { logActivity, getActivityLogs };
