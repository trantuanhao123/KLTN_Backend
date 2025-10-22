const { connection } = require("../config/database");

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
    // Không ném lỗi để không làm hỏng transaction chính
    // (Gửi thông báo thất bại không nên làm rollback việc hủy đơn)
  }
};

module.exports = {
  create,
};
