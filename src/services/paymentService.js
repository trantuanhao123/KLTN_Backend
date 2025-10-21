const paymentModel = require("../models/payment");

// 🟩 Tạo thanh toán thủ công (CASH)
async function createCashPayment(orderId, amount) {
  const paymentData = {
    ORDER_ID: orderId,
    AMOUNT: amount,
    METHOD: "CASH",
    STATUS: "SUCCESS",
    TRANSACTION_CODE: null,
    TRANSACTION_DATE: new Date(),
  };
  return await paymentModel.insertPayment(paymentData);
}

// 🟨 Lấy thanh toán theo order id
async function getPaymentByOrderId(orderId) {
  return await paymentModel.getPaymentsByOrderId(orderId);
}

module.exports = {
  createCashPayment,
  getPaymentByOrderId,
};
