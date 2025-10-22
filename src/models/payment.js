const { connection } = require("../config/database");

/**
 * Thêm một bản ghi thanh toán mới (cho PayOS, Tiền mặt, Refund)
 * @param {object} paymentData Dữ liệu thanh toán
 * @param {object} conn Kết nối transaction
 */
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

module.exports = {
  create,
  getTotalPaidByOrderId,
};
