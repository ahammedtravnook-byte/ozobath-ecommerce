// ============================================
// OZOBATH - Admin Notification Controller
// ============================================
const AdminNotification = require('../models/AdminNotification');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Helper used by other controllers to fire admin notifications
const createAdminNotification = async (type, title, message, link = null, data = {}) => {
  try {
    await AdminNotification.create({ type, title, message, link, data });
  } catch (err) {
    console.error('Admin notification creation failed:', err.message);
  }
};

// GET /admin-notifications — latest 30 admin notifications
const getAdminNotifications = asyncHandler(async (req, res) => {
  const { limit = 30 } = req.query;
  const adminId = req.user._id;

  const notifications = await AdminNotification.find()
    .sort('-createdAt')
    .limit(Number(limit))
    .lean();

  const unreadCount = notifications.filter(
    n => !n.readBy.some(id => id.toString() === adminId.toString())
  ).length;

  sendResponse(res, 200, { notifications, unreadCount }, 'Admin notifications fetched');
});

// GET /admin-notifications/unread-count
const getAdminUnreadCount = asyncHandler(async (req, res) => {
  const adminId = req.user._id;
  const count = await AdminNotification.countDocuments({
    readBy: { $ne: adminId },
    // Only count last 30 days to keep it sane
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });
  sendResponse(res, 200, { count }, 'Unread count fetched');
});

// PUT /admin-notifications/:id/read
const markAdminNotificationRead = asyncHandler(async (req, res) => {
  await AdminNotification.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { readBy: req.user._id } }
  );
  sendResponse(res, 200, null, 'Marked as read');
});

// PUT /admin-notifications/mark-all-read
const markAllAdminNotificationsRead = asyncHandler(async (req, res) => {
  const recent = await AdminNotification.find()
    .sort('-createdAt').limit(30).select('_id').lean();
  const ids = recent.map(n => n._id);
  await AdminNotification.updateMany(
    { _id: { $in: ids } },
    { $addToSet: { readBy: req.user._id } }
  );
  sendResponse(res, 200, null, 'All marked as read');
});

module.exports = {
  createAdminNotification,
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
};
