const { connection } = require("../config/database");

/**
 * 1. Tạo Review mới
 */
const create = async (reviewData, conn = connection) => {
  const sql = `
    INSERT INTO REVIEW 
    (CAR_ID, USER_ID, ORDER_ID, RATING, CONTENT) 
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await conn.execute(sql, [
    reviewData.carId,
    reviewData.userId,
    reviewData.orderId,
    reviewData.rating,
    reviewData.content || null,
  ]);
  return result.insertId;
};

/**
 * 2. Tìm Review bằng ID
 */
const findById = async (reviewId, conn = connection) => {
  const [rows] = await conn.execute(
    "SELECT * FROM REVIEW WHERE REVIEW_ID = ?",
    [reviewId]
  );
  return rows[0];
};

/**
 * 3. Tìm Review bằng Order ID (để kiểm tra đã đánh giá chưa)
 */
const findByOrderId = async (orderId, conn = connection) => {
  const [rows] = await conn.execute("SELECT * FROM REVIEW WHERE ORDER_ID = ?", [
    orderId,
  ]);
  return rows[0];
};

/**
 * 4. Cập nhật Review
 */

const update = async (reviewId, rating, content, conn = connection) => {
  const sql = `
    UPDATE REVIEW 
    SET RATING = ?, CONTENT = ?, CREATED_AT = NOW()
    WHERE REVIEW_ID = ?
  `;
  const [result] = await conn.execute(sql, [rating, content || null, reviewId]);
  return result.affectedRows;
};

/**
 * 5. Xóa Review
 */
const remove = async (reviewId, conn = connection) => {
  const [result] = await conn.execute(
    "DELETE FROM REVIEW WHERE REVIEW_ID = ?",
    [reviewId]
  );
  return result.affectedRows;
};

/**
 * 6. Lấy tất cả Review theo CAR_ID, kèm thông tin người dùng
 */
const findByCarId = async (carId, conn = connection) => {
  const sql = `
    SELECT 
      r.REVIEW_ID, r.ORDER_ID, r.CAR_ID, r.RATING, r.CONTENT, r.CREATED_AT,
      r.USER_ID, 
      u.FULLNAME, 
      u.AVATAR_URL 
    FROM REVIEW r
    LEFT JOIN USERS u ON r.USER_ID = u.USER_ID
    WHERE r.CAR_ID = ?
    ORDER BY r.CREATED_AT DESC
  `;
  const [rows] = await conn.query(sql, [carId]);
  return rows;
};

/**
 * 7. Tính toán và cập nhật điểm trung bình (AVG RATING) cho CAR
 */
const recalculateCarRating = async (carId, conn) => {
  const sql = `
    UPDATE CAR
    SET RATING = (
      SELECT AVG(RATING) 
      FROM REVIEW 
      WHERE CAR_ID = ?
    )
    WHERE CAR_ID = ?
  `;
  // Sử dụng conn (kết nối transaction) để đảm bảo tính nhất quán
  const [result] = await conn.execute(sql, [carId, carId]);
  return result.affectedRows;
};

module.exports = {
  create,
  findById,
  findByOrderId,
  update,
  remove,
  findByCarId,
  recalculateCarRating,
};
