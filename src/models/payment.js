const { connection } = require("../config/database");

const create = async (paymentData, conn = connection) => {
  const sql = `
    INSERT INTO PAYMENT (
      ORDER_ID, AMOUNT, PAYMENT_TYPE, METHOD, STATUS, TRANSACTION_CODE
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const [result] = await conn.execute(sql, [
    paymentData.orderId,
    paymentData.amount,
    paymentData.paymentType,
    paymentData.method,
    paymentData.status,
    paymentData.transactionCode,
  ]);

  return result.insertId;
};

/**
 * Lấy tổng số tiền đã trả thành công cho một đơn hàng
 * (Dùng cho Bước 6: Hủy đơn đã trả 100%)
 */
const getTotalPaidByOrderId = async (orderId, conn = connection) => {
  const sql = `
    SELECT SUM(AMOUNT) AS totalPaid
    FROM PAYMENT
    WHERE ORDER_ID = ? AND STATUS = 'SUCCESS' AND PAYMENT_TYPE != 'REFUND'
  `;
  const [rows] = await conn.execute(sql, [orderId]);
  return rows[0]?.totalPaid || 0;
};

const findByOrderId = async (orderId, conn = connection) => {
  const sql = `
    SELECT * FROM PAYMENT
    WHERE ORDER_ID = ?
    ORDER BY TRANSACTION_DATE DESC
  `;
  const [rows] = await conn.execute(sql, [orderId]);
  return rows;
};
/**
 * [MỚI] (Admin) Lấy các yêu cầu hoàn tiền đang chờ
 */
const getPendingRefunds = async (conn = connection) => {
  const sql = `
    SELECT p.*, ro.ORDER_CODE, ro.NOTE 
    FROM PAYMENT p
    JOIN RENTAL_ORDER ro ON p.ORDER_ID = ro.ORDER_ID
    WHERE p.PAYMENT_TYPE = 'REFUND' AND p.STATUS = 'PROCESSING'
    ORDER BY p.TRANSACTION_DATE ASC
  `;
  const [rows] = await conn.execute(sql);
  return rows;
};

/**
 * [MỚI] (Admin) Cập nhật trạng thái thanh toán
 */
const updateStatus = async (paymentId, status, conn = connection) => {
  const [result] = await conn.execute(
    "UPDATE PAYMENT SET STATUS = ? WHERE PAYMENT_ID = ?",
    [status, paymentId]
  );
  return result.affectedRows;
};

/**
 * [MỚI] Tìm payment bằng ID
 */
const findById = async (paymentId, conn = connection) => {
  const [rows] = await conn.execute(
    "SELECT * FROM PAYMENT WHERE PAYMENT_ID = ?",
    [paymentId]
  );
  return rows[0];
};
module.exports = {
  create,
  getTotalPaidByOrderId,
  findByOrderId,
  getPendingRefunds,
  updateStatus,
  findById,
};
