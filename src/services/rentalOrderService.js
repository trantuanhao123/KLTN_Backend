const { connection } = require("../config/database");
const crypto = require("crypto");
const {
  createRentalOrder,
  getRentalOrderById,
  getRentalOrdersByUser,
  getAllRentalOrders,
  updateRentalOrderStatus,
  overwriteExtraFee,
  deleteRentalOrder,
} = require("../models/rentalOrder");

async function createOrder(data) {
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    const [carRows] = await conn.execute(
      "SELECT STATUS, PRICE_PER_DAY, PRICE_PER_HOUR FROM CAR WHERE CAR_ID = ?",
      [data.car_id]
    );
    if (!carRows.length || carRows[0].STATUS !== "AVAILABLE") {
      throw new Error("Xe không khả dụng hoặc đã được thuê.");
    }

    const { rental_type } = data;
    let basePrice = 0;
    if (rental_type === "DAY") {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const days = Math.max(
        1,
        Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      );
      basePrice = carRows[0].PRICE_PER_DAY * days;
    } else if (rental_type === "HOUR") {
      const start = new Date(`${data.start_date}T${data.start_time}`);
      const end = new Date(`${data.end_date}T${data.end_time}`);
      const hours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
      basePrice = carRows[0].PRICE_PER_HOUR * hours;
    } else {
      throw new Error("Phải chọn loại thuê theo ngày hoặc theo giờ.");
    }

    const orderCode =
      "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();

    const orderData = {
      order_code: orderCode,
      user_id: data.user_id,
      car_id: data.car_id,
      status: "PENDING",
      start_date: data.start_date,
      end_date: data.end_date,
      pickup_branch_id: data.pickup_branch_id || null,
      return_branch_id: data.return_branch_id || null,
      rental_price: basePrice,
      total_amount: basePrice,
      final_amount: basePrice,
      discount_id: null,
      extra_fee: 0,
      note: data.note || null,
      paid: 0,
    };

    const orderId = await createRentalOrder(orderData);
    await conn.execute("UPDATE CAR SET STATUS = 'RESERVED' WHERE CAR_ID = ?", [
      data.car_id,
    ]);

    await conn.commit();
    return {
      order_id: orderId,
      order_code: orderCode,
      final_amount: basePrice,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getOrder(orderId) {
  const order = await getRentalOrderById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn thuê.");
  return order;
}

async function getOrdersByUser(userId) {
  return await getRentalOrdersByUser(userId);
}

async function getAllOrders() {
  return await getAllRentalOrders();
}

async function changeOrderStatus(orderId, status) {
  const success = await updateRentalOrderStatus(orderId, status);
  if (!success) throw new Error("Không thể cập nhật trạng thái đơn hàng.");
  return true;
}

// ✅ Transaction: thêm hoặc ghi đè phí phát sinh
async function setExtraFeeForOrder(orderId, amount, reason) {
  if (amount < 0) throw new Error("Số tiền phát sinh không hợp lệ.");

  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    // Ghi đè phí phát sinh và cập nhật trạng thái + paid
    const [result] = await conn.execute(
      `UPDATE RENTAL_ORDER
       SET EXTRA_FEE = ?, 
           FINAL_AMOUNT = TOTAL_AMOUNT + ?, 
           NOTE = ?, 
           STATUS = 'FEE_INCURRED', 
           PAID = 0
       WHERE ORDER_ID = ?`,
      [amount, amount, reason || "Chi phí phát sinh", orderId]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không thể cập nhật chi phí phát sinh.");
    }

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function removeOrder(orderId) {
  const success = await deleteRentalOrder(orderId);
  if (!success) throw new Error("Không thể xóa đơn hàng.");
  return true;
}

module.exports = {
  createOrder,
  getOrder,
  getOrdersByUser,
  getAllOrders,
  changeOrderStatus,
  setExtraFeeForOrder,
  removeOrder,
};
