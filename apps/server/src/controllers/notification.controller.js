// ============================================
// OZOBATH - Notification Controller
// ============================================
const Notification = require('../models/Notification');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Helper to create a notification (used internally from other controllers)
const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    await Notification.create({ user: userId, type, title, message, data });
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
};

// GET /notifications — get user's notifications
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const filter = { user: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;

  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  sendResponse(res, 200, {
    notifications,
    unreadCount,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  }, 'Notifications fetched');
});

// GET /notifications/unread-count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  sendResponse(res, 200, { count }, 'Unread count fetched');
});

// PUT /notifications/:id/read — mark single as read
const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true, readAt: new Date() }
  );
  sendResponse(res, 200, null, 'Notification marked as read');
});

// PUT /notifications/mark-all-read
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  sendResponse(res, 200, null, 'All notifications marked as read');
});

// DELETE /notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  sendResponse(res, 200, null, 'Notification deleted');
});

module.exports = { createNotification, getNotifications, getUnreadCount, markAsRead, markAllRead, deleteNotification };
