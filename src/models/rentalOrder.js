const { connection } = require("../config/database");

const create = async (orderData, conn) => {
  // Đã dọn dẹp các ký tự trắng vô hình
  const sql = `INSERT INTO RENTAL_ORDER (
      ORDER_CODE, USER_ID, CAR_ID, STATUS, START_DATE, END_DATE,
      RENTAL_PRICE, TOTAL_AMOUNT, FINAL_AMOUNT, PAYMENT_STATUS, EXPIRES_AT,
      DISCOUNT_ID, PICKUP_BRANCH_ID, RETURN_BRANCH_ID
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const [result] = await conn.execute(sql, [
    orderData.orderCode,
    orderData.userId,
    orderData.carId,
    orderData.status || "PENDING_PAYMENT",
    orderData.startDate,
    orderData.endDate,
    orderData.rentalPrice,
    orderData.totalAmount,
    orderData.finalAmount,
    orderData.paymentStatus || "UNPAID",
    orderData.expiresAt,
    orderData.discountId,
    orderData.pickupBranchId,
    orderData.returnBranchId,
  ]);

  return {
    orderId: result.insertId,
    orderCode: orderData.orderCode,
  };
};

/**
 * Tìm đơn hàng bằng ORDER_CODE (dùng cho webhook)
 */
const findByCode = async (orderCode, conn = connection) => {
  const [rows] = await conn.execute(
    "SELECT * FROM RENTAL_ORDER WHERE ORDER_CODE = ?",
    [orderCode]
  );
  return rows[0];
};

/**
 * Tìm đơn hàng bằng ORDER_ID
 */
const findById = async (orderId, conn = connection) => {
  const [rows] = await conn.execute(
    "SELECT * FROM RENTAL_ORDER WHERE ORDER_ID = ?",
    [orderId]
  );
  return rows[0];
};

/**
 * Cập nhật trạng thái đơn hàng (chung)
 */
const update = async (orderId, data, conn = connection) => {
  const fields = Object.keys(data); // [ 'STATUS', 'PAYMENT_STATUS', 'EXTRA_FEE' ]
  const values = Object.values(data); // [ 'CONFIRMED', 'PAID', 100000 ]

  const setClause = fields.map((field) => `${field} = ?`).join(", "); // "STATUS = ?, PAYMENT_STATUS = ?, EXTRA_FEE = ?"

  const sql = `UPDATE RENTAL_ORDER SET ${setClause} WHERE ORDER_ID = ?`;

  const [result] = await conn.execute(sql, [...values, orderId]);
  return result.affectedRows;
};

/**
 * Lấy các đơn hàng PENDING_PAYMENT đã hết hạn (cho Cron Job - Bước 3, TH2)
 */
const findExpiredPendingOrders = async (conn = connection) => {
  const [rows] = await conn.execute(
    `SELECT ORDER_ID, CAR_ID 
     FROM RENTAL_ORDER 
     WHERE STATUS = 'PENDING_PAYMENT' AND EXPIRES_AT < NOW()`
  );
  return rows;
};
/**
 * [SỬA ĐỔI] (Admin) Lấy tất cả đơn hàng, kèm số lượng giao dịch VÀ TỔNG TIỀN ĐÃ TRẢ
 */
const adminGetAllWithTxCount = async (conn = connection) => {
  const sql = `
    SELECT
      ro.*,
      
      (SELECT COUNT(*) 
       FROM PAYMENT p 
       WHERE p.ORDER_ID = ro.ORDER_ID) AS transactionCount,
       
      (SELECT SUM(p.AMOUNT) 
       FROM PAYMENT p 
       WHERE p.ORDER_ID = ro.ORDER_ID AND p.STATUS = 'SUCCESS' AND p.AMOUNT > 0) AS totalPaid
       
    FROM RENTAL_ORDER ro
    ORDER BY ro.CREATED_AT DESC
  `;
  const [rows] = await conn.execute(sql);
  return rows;
};

/**
 * [MỚI] (Admin) Xóa cứng một đơn hàng
 * (Lưu ý: Bảng PAYMENT đã có ON DELETE CASCADE nên sẽ tự xóa theo)
 */
const hardDeleteById = async (orderId, conn = connection) => {
  const sql = `DELETE FROM RENTAL_ORDER WHERE ORDER_ID = ?`;
  const [result] = await conn.execute(sql, [orderId]);
  return result.affectedRows;
};
/**
 * [MỚI] (Admin) Lấy tất cả đơn hàng của một User
 */
const findByUserId = async (userId, conn = connection) => {
  const [rows] = await conn.execute(
    "SELECT * FROM RENTAL_ORDER WHERE USER_ID = ? ORDER BY CREATED_AT DESC",
    [userId]
  );
  return rows;
};

module.exports = {
  create,
  findById,
  findByCode,
  findByUserId,
  update,
  findExpiredPendingOrders,
  adminGetAllWithTxCount,
  hardDeleteById,
};
