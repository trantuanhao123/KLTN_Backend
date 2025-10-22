const { connection } = require("../config/database");
const payos = require("../config/payos");
const rentalOrderModel = require("../models/rentalOrder");
const paymentModel = require("../models/payment");

const handlePayOSWebhook = async (webhookBody) => {
  let conn;
  try {
    console.log("Tiếp nhận Webhook PayOS:", JSON.stringify(webhookBody));

    const data = webhookBody.data;

    // 1. Kiểm tra trạng thái thanh toán (Dùng logic của code cũ)
    if (
      webhookBody.code !== "00" &&
      (!data || (data.code !== "00" && data.desc !== "success"))
    ) {
      console.log(
        `Webhook báo thất bại (code: ${webhookBody.code}, data.code: ${
          data ? data.code : "N/A"
        }), bỏ qua.`
      );
      return { message: "Payment failed or pending, no action taken." };
    }

    console.log("Webhook báo thanh toán THÀNH CÔNG.");

    // 2. Lấy dữ liệu
    const { orderCode, amount, reference } = data;
    const orderId = orderCode;

    if (!orderId) {
      throw new Error(`Webhook: Không tìm thấy orderCode trong data.`);
    }

    // 3. Bắt đầu Transaction
    conn = await connection.getConnection();
    await conn.beginTransaction();

    // 4. Lấy đơn hàng
    const [rows] = await conn.execute(
      "SELECT * FROM RENTAL_ORDER WHERE ORDER_ID = ? FOR UPDATE",
      [orderId]
    );
    const order = rows[0];

    if (!order) {
      throw new Error(`Webhook: Không tìm thấy đơn hàng ${orderId}.`);
    }

    // 5. Idempotency Check (Kiểm tra xử lý trùng lặp)
    if (order.STATUS !== "PENDING_PAYMENT") {
      console.log(
        `Webhook: Đơn ${orderId} đã được xử lý (Status: ${order.STATUS}). Bỏ qua.`
      );
      await conn.commit();
      return { message: "Order already processed." };
    }

    console.log(`Webhook: Đang xử lý đơn ${orderId}...`);

    // 6. Cập nhật DB (Bước 3, TH1)

    // 6.1. UPDATE RENTAL_ORDER
    // So sánh số tiền nhận (amount) với tổng giá trị đơn (FINAL_AMOUNT)
    const paymentStatus = amount >= order.FINAL_AMOUNT ? "PAID" : "PARTIAL";

    await rentalOrderModel.update(
      orderId,
      {
        STATUS: "CONFIRMED",
        PAYMENT_STATUS: paymentStatus,
      },
      conn
    );

    // 6.2. INSERT INTO PAYMENT
    // Quyết định loại thanh toán (DEPOSIT hoặc FINAL)
    const paymentType = paymentStatus === "PAID" ? "FINAL_PAYMENT" : "DEPOSIT";

    await paymentModel.create(
      {
        orderId: orderId,
        amount: amount,
        paymentType: paymentType,
        method: "PayOS",
        status: "SUCCESS",
        transactionCode: reference, // Dùng mã giao dịch của PayOS
      },
      conn
    );

    // 7. Commit
    await conn.commit();
    console.log(`Webhook: Xử lý thành công đơn ${orderId}.`);

    return { message: "Webhook processed successfully." };
  } catch (error) {
    if (conn) await conn.rollback();

    console.error("Lỗi nghiêm trọng khi xử lý Webhook:", error);
    throw new Error(error.message || "Internal server error");
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  handlePayOSWebhook,
};
