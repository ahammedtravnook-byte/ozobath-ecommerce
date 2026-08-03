// ============================================
// OZOBATH - Admin Activity Log Controller
// ============================================
const AdminActivityLog = require('../models/AdminActivityLog');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { paginate } = require('../utils/pagination');
const { escapeRegex } = require('../utils/sanitize');
const { isValidObjectId } = require('mongoose');

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
  const { resource, action, userId } = req.query;
  const { page, limit, skip } = paginate(req.query, { defaultLimit: 50 });

  const filter = {};
  if (resource) filter.resource = String(resource);
  // Escaped — an unescaped user pattern here is a ReDoS run inside MongoDB.
  if (action) filter.action = { $regex: escapeRegex(String(action).slice(0, 100)), $options: 'i' };
  if (userId && isValidObjectId(userId)) filter.user = userId;

  const [logs, total] = await Promise.all([
    AdminActivityLog.find(filter)
      .populate('user', 'name email role')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    AdminActivityLog.countDocuments(filter),
  ]);

  sendResponse(res, 200, { logs, total, page, pages: Math.ceil(total / limit) }, 'Activity logs fetched');
});

module.exports = { logActivity, getActivityLogs };
