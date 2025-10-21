const { PayOS } = require("@payos/node");
const paymentModel = require("../models/payment");

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

// 🟩 Tạo link thanh toán PayOS
async function createPayment(data) {
  if (!data.orderId || !data.amount)
    throw new Error("Thiếu orderId hoặc amount");

  const order = {
    amount: data.amount,
    orderCode: data.orderId, // 🔥 Quan trọng: mapping ORDER_ID sang PayOS orderCode
    description:
      data.description || `Thanh toán thuê xe - Mã đơn ${data.orderId}`,
    cancelUrl: "http://localhost:5173/payment/cancel",
    returnUrl: "http://localhost:5173/payment/success",
  };

  const paymentLink = await payos.paymentRequests.create(order);
  console.log("✅ Tạo link thanh toán cho đơn:", data.orderId);
  return paymentLink.checkoutUrl;
}

// 🟦 Xử lý webhook từ PayOS
async function handleWebhook(body) {
  console.log("Webhook data:", body);

  // Dữ liệu thực nằm trong body.data
  const data = body.data;
  if (!data || !data.orderCode) {
    console.warn("⚠️ Không có orderCode trong webhook");
    return { success: false, message: "Invalid data" };
  }

  // Kiểm tra mã code
  if (data.code === "00" || body.code === "00" || data.desc === "success") {
    const orderId = data.orderCode; // ✅ chính là ORDER_ID
    console.log("✅ Thanh toán thành công cho đơn:", orderId);

    // Lưu lịch sử thanh toán
    await paymentModel.insertPayment({
      ORDER_ID: orderId,
      AMOUNT: data.amount,
      METHOD: "PayOS",
      STATUS: "SUCCESS",
      TRANSACTION_CODE: data.reference,
      TRANSACTION_DATE: data.transactionDateTime,
    });

    // Cập nhật trạng thái đơn thuê
    await paymentModel.updateOrderStatus(orderId, "CONFIRMED", 1);
  } else {
    console.log("❌ Thanh toán thất bại hoặc bị hủy.");
  }

  return { success: true };
}

module.exports = { createPayment, handleWebhook };
