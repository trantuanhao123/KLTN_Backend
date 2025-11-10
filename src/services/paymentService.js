const { connection } = require("../config/database");
const rentalOrderModel = require("../models/rentalOrder");
const paymentModel = require("../models/payment");
const notificationModel = require("../models/notification");

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
/**
 * (Admin) Lấy danh sách chờ hoàn tiền
 */
const adminGetPendingRefunds = async () => {
  try {
    const refunds = await paymentModel.getPendingRefunds();
    return refunds;
  } catch (error) {
    console.error("Lỗi khi lấy ds hoàn tiền (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  }
};

/**
 * [MỚI] (Admin) Xác nhận đã hoàn tiền
 */
const adminConfirmRefund = async (paymentId, adminId) => {
  let conn;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    // 1. Lấy thông tin giao dịch
    const payment = await paymentModel.findById(paymentId, conn);
    if (!payment) {
      throw new Error("Không tìm thấy giao dịch hoàn tiền.");
    }
    if (payment.PAYMENT_TYPE !== "REFUND" || payment.STATUS !== "PROCESSING") {
      throw new Error("Giao dịch không hợp lệ hoặc đã được xử lý.");
    }

    // 2. Cập nhật trạng thái payment thành 'REFUNDED' (theo ENUM)
    await paymentModel.updateStatus(paymentId, "REFUNDED", conn);

    // 3. Lấy thông tin user để gửi thông báo
    const order = await rentalOrderModel.findById(payment.ORDER_ID, conn);

    // 4. Gửi thông báo cho user
    if (order) {
      await notificationModel.create(
        {
          USER_ID: order.USER_ID,
          TITLE: `Đã hoàn tiền cho đơn ${order.ORDER_CODE}`,
          CONTENT: `Khoản hoàn tiền ${Math.abs(payment.AMOUNT)}đ cho đơn hàng ${
            order.ORDER_CODE
          } đã được xử lý. Tiền sẽ về tài khoản của bạn sau vài phút.`,
        },
        conn
      );
    }

    await conn.commit();
    return { message: "Xác nhận hoàn tiền thành công." };
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Lỗi khi xác nhận hoàn tiền (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  } finally {
    if (conn) conn.release();
  }
};
const getOrderStatus = async (orderId) => {
  try {
    // Rất quan trọng: Chỉ lấy các trường cần thiết, không lộ
    // thông tin nhạy cảm của đơn hàng.
    const order = await rentalOrderModel.findById(orderId);

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng.");
    }
    return {
      status: order.STATUS,
      paymentStatus: order.PAYMENT_STATUS,
    };
  } catch (error) {
    console.error("Lỗi khi lấy trạng thái đơn hàng (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  }
};
module.exports = {
  handlePayOSWebhook,
  adminGetPendingRefunds,
  adminConfirmRefund,
  getOrderStatus,
};
