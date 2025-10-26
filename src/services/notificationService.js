const NotificationModel = require("../models/notification");
const UserModel = require("../models/user"); // Cần để lấy danh sách user

/**
 * Lấy tất cả thông báo cho 1 user (dùng cho cả customer và admin)
 */
async function getNotificationsForUser(userId) {
  return await NotificationModel.findByUserId(userId);
}

/**
 * Lấy số thông báo chưa đọc
 */
async function getUnreadNotificationCount(userId) {
  return await NotificationModel.getUnreadCount(userId);
}

/**
 * (Admin) Tạo thông báo cho một user cụ thể
 */
async function createNotification(data) {
  const { userId, title, content } = data;

  // Kiểm tra xem user có tồn tại không
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }

  const insertId = await NotificationModel.create({
    USER_ID: userId,
    TITLE: title,
    CONTENT: content,
  });

  if (!insertId) {
    throw new Error("Tạo thông báo thất bại");
  }
  return { id: insertId, ...data };
}

/**
 * (Admin) Tạo thông báo cho tất cả user (trừ Admin)
 */
async function createNotificationForAllUsers(data) {
  const { title, content } = data;

  // 1. Lấy tất cả user (hàm getAll() của bạn đã loại trừ ADMIN)
  const users = await UserModel.getAll();
  if (!users || users.length === 0) {
    return { message: "Không tìm thấy người dùng nào để gửi thông báo." };
  }

  // 2. Chuẩn bị dữ liệu cho bulk insert
  const now = new Date();
  const notificationsData = users.map((user) => [
    user.USER_ID,
    title,
    content,
    0, // IS_READ
    now, // CREATED_AT
  ]);

  // 3. Insert hàng loạt
  const affectedRows = await NotificationModel.createBulk(notificationsData);
  return { message: `Đã gửi thông báo đến ${affectedRows} người dùng.` };
}

/**
 * Đánh dấu một thông báo là đã đọc
 */
async function markNotificationAsRead(notificationId, userId) {
  const affectedRows = await NotificationModel.markAsRead(
    notificationId,
    userId
  );
  if (affectedRows === 0) {
    throw new Error("Thông báo không tồn tại hoặc bạn không có quyền");
  }
  return { message: "Đã đánh dấu là đã đọc" };
}

/**
 * Đánh dấu tất cả thông báo là đã đọc
 */
async function markAllNotificationsAsRead(userId) {
  const affectedRows = await NotificationModel.markAllAsRead(userId);
  return { message: `Đã đánh dấu ${affectedRows} thông báo là đã đọc.` };
}

module.exports = {
  getNotificationsForUser,
  getUnreadNotificationCount,
  createNotification,
  createNotificationForAllUsers,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
