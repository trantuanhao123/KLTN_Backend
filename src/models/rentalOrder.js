const { connection } = require("../config/database");

// 🟩 Tạo đơn thuê mới
async function createRentalOrder(orderData) {
  const [result] = await connection.execute(
    `INSERT INTO RENTAL_ORDER 
    (ORDER_CODE, USER_ID, CAR_ID, STATUS, START_DATE, END_DATE, PICKUP_BRANCH_ID, RETURN_BRANCH_ID,
     RENTAL_PRICE, TOTAL_AMOUNT, FINAL_AMOUNT, DISCOUNT_ID, EXTRA_FEE, NOTE, PAID)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderData.order_code,
      orderData.user_id,
      orderData.car_id,
      orderData.status,
      orderData.start_date,
      orderData.end_date,
      orderData.pickup_branch_id,
      orderData.return_branch_id,
      orderData.rental_price,
      orderData.total_amount,
      orderData.final_amount,
      orderData.discount_id,
      orderData.extra_fee,
      orderData.note,
      orderData.paid,
    ]
  );
  return result.insertId;
}

// 🟦 Lấy đơn thuê theo ID
async function getRentalOrderById(orderId) {
  const [rows] = await connection.execute(
    `SELECT o.*, u.FULLNAME, c.LICENSE_PLATE, c.BRAND, c.MODEL 
     FROM RENTAL_ORDER o
     JOIN USERS u ON o.USER_ID = u.USER_ID
     JOIN CAR c ON o.CAR_ID = c.CAR_ID
     WHERE o.ORDER_ID = ?`,
    [orderId]
  );
  return rows[0];
}

// 🟨 Lấy đơn theo user
async function getRentalOrdersByUser(userId) {
  const [rows] = await connection.execute(
    `SELECT * FROM RENTAL_ORDER WHERE USER_ID = ? ORDER BY CREATED_AT DESC`,
    [userId]
  );
  return rows;
}

// 🟧 Lấy tất cả đơn
async function getAllRentalOrders() {
  const [rows] = await connection.execute(
    `SELECT o.*, u.FULLNAME, c.LICENSE_PLATE, c.BRAND, c.MODEL 
     FROM RENTAL_ORDER o
     JOIN USERS u ON o.USER_ID = u.USER_ID
     JOIN CAR c ON o.CAR_ID = c.CAR_ID
     ORDER BY o.CREATED_AT DESC`
  );
  return rows;
}

// 🟥 Cập nhật trạng thái
async function updateRentalOrderStatus(orderId, status) {
  const [result] = await connection.execute(
    `UPDATE RENTAL_ORDER SET STATUS = ? WHERE ORDER_ID = ?`,
    [status, orderId]
  );
  return result.affectedRows > 0;
}

// 🟪 Cập nhật phí phát sinh (ghi đè, không cộng dồn)
async function overwriteExtraFee(orderId, amount, note) {
  const [result] = await connection.execute(
    `UPDATE RENTAL_ORDER
     SET EXTRA_FEE = ?, 
         FINAL_AMOUNT = TOTAL_AMOUNT + ?, 
         NOTE = ?, 
         STATUS = 'FEE_INCURRED', 
         PAID = 0
     WHERE ORDER_ID = ?`,
    [amount, amount, note || "Chi phí phát sinh", orderId]
  );
  return result.affectedRows > 0;
}

// 🟫 Xóa đơn thuê
async function deleteRentalOrder(orderId) {
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    // Lấy CAR_ID của đơn
    const [rows] = await conn.execute(
      `SELECT CAR_ID FROM RENTAL_ORDER WHERE ORDER_ID = ?`,
      [orderId]
    );
    if (rows.length === 0) throw new Error("Không tìm thấy đơn hàng.");

    const carId = rows[0].CAR_ID;

    // Xóa đơn
    await conn.execute(`DELETE FROM RENTAL_ORDER WHERE ORDER_ID = ?`, [
      orderId,
    ]);

    // Cập nhật trạng thái xe về AVAILABLE
    await conn.execute(`UPDATE CAR SET STATUS = 'AVAILABLE' WHERE CAR_ID = ?`, [
      carId,
    ]);

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  createRentalOrder,
  getRentalOrderById,
  getRentalOrdersByUser,
  getAllRentalOrders,
  updateRentalOrderStatus,
  overwriteExtraFee,
  deleteRentalOrder,
};
