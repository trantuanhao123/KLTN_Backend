const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");

// === Route cho User (Customer & Admin) ===

// Lấy tất cả thông báo của user đang đăng nhập
// GET /api/v1/notifications
router.get(
  "/",
  authMiddleware,
  NotificationController.handleGetMyNotifications
);

// Lấy số thông báo chưa đọc
// GET /api/v1/notifications/unread-count
router.get(
  "/unread-count",
  authMiddleware,
  NotificationController.handleGetUnreadCount
);

// Đánh dấu 1 thông báo là đã đọc
// PATCH /api/v1/notifications/:id/read
router.patch(
  "/read/:id",
  authMiddleware,
  NotificationController.handleMarkAsRead
);

// Đánh dấu tất cả thông báo là đã đọc
// PATCH /api/v1/notifications/read-all
router.patch(
  "/read-all",
  authMiddleware,
  NotificationController.handleMarkAllAsRead
);

// === Route cho Admin (Quản lý) ===

// Tạo thông báo cho 1 user cụ thể
// POST /api/v1/notifications/user
router.post(
  "/user",
  authMiddleware,
  requireAdmin,
  NotificationController.handleCreateNotification
);

// Tạo thông báo cho TẤT CẢ user
// POST /api/v1/notifications/all-users
router.post(
  "/all-users",
  authMiddleware,
  requireAdmin,
  NotificationController.handleCreateNotificationForAll
);

module.exports = router;
