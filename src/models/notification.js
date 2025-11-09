const { connection } = require("../config/database");

/**
 * Tạo một thông báo (cho 1 user)
 * Hàm này được thiết kế để có thể chạy bên trong một transaction
 */
const create = async (notificationData, conn = connection) => {
  const sql = `
    INSERT INTO NOTIFICATION (USER_ID, TITLE, CONTENT, IS_READ, CREATED_AT)
    VALUES (?, ?, ?, 0, NOW())
  `;
  try {
    const [result] = await conn.execute(sql, [
      notificationData.USER_ID,
      notificationData.TITLE,
      notificationData.CONTENT,
    ]);
    return result.insertId;
  } catch (error) {
    console.error("Lỗi khi tạo thông báo (Model):", error);
    // Nếu đang trong transaction (conn != connection), không ném lỗi
    // để không làm hỏng transaction chính.
    if (conn !== connection) {
      return null; // Trả về null để service cha biết là có lỗi
    }
    // Nếu không phải transaction, ném lỗi để controller bắt
    throw new Error("Lỗi khi tạo thông báo: " + error.message);
  }
};

/**
 * Tạo nhiều thông báo cùng lúc (cho chức năng "Gửi tất cả")
 */
const createBulk = async (notificationsData, conn = connection) => {
  const sql = `
    INSERT INTO NOTIFICATION (USER_ID, TITLE, CONTENT, IS_READ, CREATED_AT)
    VALUES ?
  `;
  try {
    // notificationsData phải là mảng 2 chiều:
    // [ [USER_ID_1, TITLE, CONTENT, 0, NOW()], [USER_ID_2, TITLE, CONTENT, 0, NOW()] ]
    const [result] = await conn.query(sql, [notificationsData]);
    return result.affectedRows;
  } catch (error) {
    console.error("Lỗi khi tạo thông báo hàng loạt (Model):", error);
    throw new Error("Lỗi khi tạo thông báo hàng loạt: " + error.message);
  }
};

/**
 * Lấy tất cả thông báo cho một user (mới nhất trước)
 */
const findByUserId = async (userId, conn = connection) => {
  const sql = `
    SELECT * FROM NOTIFICATION 
    WHERE USER_ID = ? 
    ORDER BY CREATED_AT DESC
  `;
  const [rows] = await conn.query(sql, [userId]);
  return rows;
};

/**
 *  Đếm số thông báo chưa đọc
 */
const getUnreadCount = async (userId, conn = connection) => {
  const sql = `
    SELECT COUNT(*) AS unreadCount 
    FROM NOTIFICATION 
    WHERE USER_ID = ? AND IS_READ = 0
  `;
  const [rows] = await conn.query(sql, [userId]);
  return rows[0].unreadCount;
};

/**
 * Đánh dấu một thông báo là đã đọc
 */
const markAsRead = async (notificationId, userId, conn = connection) => {
  const sql = `
    UPDATE NOTIFICATION 
    SET IS_READ = 1 
    WHERE NOTIFICATION_ID = ? AND USER_ID = ?
  `;
  const [result] = await conn.execute(sql, [notificationId, userId]);
  return result.affectedRows;
};

/**
 *  Đánh dấu TẤT CẢ thông báo là đã đọc
 */
const markAllAsRead = async (userId, conn = connection) => {
  const sql = `
    UPDATE NOTIFICATION 
    SET IS_READ = 1 
    WHERE USER_ID = ? AND IS_READ = 0
  `;
  const [result] = await conn.execute(sql, [userId]);
  return result.affectedRows;
};

module.exports = {
  create,
  createBulk,
  findByUserId,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
