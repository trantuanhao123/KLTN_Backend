const NotificationService = require("../services/notificationService");

// [GET] /api/v1/notifications
// Lấy tất cả thông báo của user đang đăng nhập (cả admin và customer)
const handleGetMyNotifications = async (req, res) => {
  try {
    // SỬA Ở ĐÂY: Lấy USER_ID (viết hoa) từ req.user
    const userId = req.user.USER_ID;

    const notifications = await NotificationService.getNotificationsForUser(
      userId
    );
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// [GET] /api/v1/notifications/unread-count
// Lấy số thông báo chưa đọc
const handleGetUnreadCount = async (req, res) => {
  try {
    // SỬA Ở ĐÂY: Lấy USER_ID (viết hoa) từ req.user
    const userId = req.user.USER_ID;

    const count = await NotificationService.getUnreadNotificationCount(userId);
    res.status(200).json({
      message: "Lấy số thông báo chưa đọc thành công",
      data: { unreadCount: count },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// [POST] /api/v1/notifications/user
// (Admin) Tạo thông báo cho 1 user (Không cần sửa, vì lấy userId từ body)
const handleCreateNotification = async (req, res) => {
  try {
    const { userId, title, content } = req.body;
    if (!userId || !title || !content) {
      return res.status(400).json({
        message: "Vui lòng cung cấp đủ thông tin (userId, title, content)",
      });
    }

    const result = await NotificationService.createNotification({
      userId,
      title,
      content,
    });
    res.status(201).json({ message: "Tạo thông báo thành công", data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// [POST] /api/v1/notifications/all-users
// (Admin) Tạo thông báo cho tất cả user (Không cần sửa)
const handleCreateNotificationForAll = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp đủ thông tin (title, content)" });
    }
    const result = await NotificationService.createNotificationForAllUsers({
      title,
      content,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// [PATCH] /api/v1/notifications/read/:id
// Đánh dấu 1 thông báo là đã đọc
const handleMarkAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    // SỬA Ở ĐÂY: Lấy USER_ID (viết hoa) từ req.user
    const userId = req.user.USER_ID;

    const result = await NotificationService.markNotificationAsRead(id, userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// [PATCH] /api/v1/notifications/read-all
// Đánh dấu TẤT CẢ thông báo là đã đọc
const handleMarkAllAsRead = async (req, res) => {
  try {
    // SỬA Ở ĐÂY: Lấy USER_ID (viết hoa) từ req.user
    const userId = req.user.USER_ID;

    const result = await NotificationService.markAllNotificationsAsRead(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  handleGetMyNotifications,
  handleGetUnreadCount,
  handleCreateNotification,
  handleCreateNotificationForAll,
  handleMarkAsRead,
  handleMarkAllAsRead,
};
