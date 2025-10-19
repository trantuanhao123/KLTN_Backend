// services/payosService.js
const { PayOS } = require("@payos/node");

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

async function createPayment(data) {
  const order = {
    amount: data.amount,
    orderCode: Date.now(),
    description: data.description || "Thanh toán thuê xe",
    cancelUrl: "http://localhost:5173/payment/cancel",
    returnUrl: "http://localhost:5173/payment/success",
  };

  const paymentLink = await payos.paymentRequests.create(order);
  return paymentLink.checkoutUrl;
}

async function handleWebhook(body) {
  // xử lý dữ liệu từ webhook (ví dụ cập nhật DB)
  console.log("Webhook data:", body);
  if (body.code === "00" || body.status === "PAID") {
    console.log("✅ Thanh toán thành công cho đơn:", body.orderCode);

    // TODO: Cập nhật DB: ví dụ
    // await RentalModel.updateStatus(body.orderCode, "PAID");
  }

  return { success: true };
}

module.exports = { createPayment, handleWebhook };
