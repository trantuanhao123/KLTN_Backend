const { connection } = require("../config/database");

const create = async (orderData, conn) => {
  const sql = `
    INSERT INTO RENTAL_ORDER (
      ORDER_CODE, USER_ID, CAR_ID, STATUS, START_DATE, END_DATE,
      RENTAL_PRICE, TOTAL_AMOUNT, FINAL_AMOUNT, PAYMENT_STATUS, EXPIRES_AT, 
      DISCOUNT_ID 
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `; // <-- Thêm DISCOUNT_ID

  const [result] = await conn.execute(sql, [
    orderData.orderCode,
    orderData.userId,
    orderData.carId,
    "PENDING_PAYMENT", // STATUS
    orderData.startDate,
    orderData.endDate,
    orderData.rentalPrice,
    orderData.totalAmount,
    orderData.finalAmount, // ⬅️ finalAmount này đã được giảm giá
    "UNPAID", // PAYMENT_STATUS
    orderData.expiresAt,
    orderData.discountId, // <-- Thêm giá trị discountId
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

module.exports = {
  create,
  findById,
  findByCode,
  update,
  findExpiredPendingOrders,
};
