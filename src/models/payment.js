const { connection } = require("../config/database");

// 🟩 Thêm bản ghi thanh toán mới
async function insertPayment({
  ORDER_ID,
  AMOUNT,
  METHOD = "PayOS",
  STATUS = "PROCESSING",
  TRANSACTION_CODE = null,
  TRANSACTION_DATE = new Date(),
}) {
  const [result] = await connection.execute(
    `INSERT INTO PAYMENT (ORDER_ID, AMOUNT, METHOD, STATUS, TRANSACTION_CODE, TRANSACTION_DATE)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [ORDER_ID, AMOUNT, METHOD, STATUS, TRANSACTION_CODE, TRANSACTION_DATE]
  );
  return result.insertId;
}

// 🟦 Cập nhật trạng thái đơn thuê
async function updateOrderStatus(orderId, status, paid = 1) {
  await connection.execute(
    `UPDATE RENTAL_ORDER SET STATUS = ?, PAID = ? WHERE ORDER_ID = ?`,
    [status, paid, orderId]
  );
}

// 🟨 Lấy thanh toán theo ORDER_ID
async function getPaymentsByOrderId(orderId) {
  const [rows] = await connection.execute(
    `SELECT * FROM PAYMENT WHERE ORDER_ID = ? ORDER BY TRANSACTION_DATE DESC`,
    [orderId]
  );
  return rows;
}

// 🔹 Lấy theo mã giao dịch
async function getPaymentByTransactionCode(transactionCode) {
  const [rows] = await connection.execute(
    `SELECT * FROM PAYMENT WHERE TRANSACTION_CODE = ? LIMIT 1`,
    [transactionCode]
  );
  return rows[0] || null;
}

// 🔹 Cập nhật trạng thái giao dịch
async function updatePaymentStatus(transactionCode, status) {
  await connection.execute(
    `UPDATE PAYMENT SET STATUS = ? WHERE TRANSACTION_CODE = ?`,
    [status, transactionCode]
  );
}

module.exports = {
  insertPayment,
  updateOrderStatus,
  getPaymentsByOrderId,
  getPaymentByTransactionCode,
  updatePaymentStatus,
};
