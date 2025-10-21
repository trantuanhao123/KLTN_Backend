const paymentService = require("../services/paymentService");

// 🟩 Tạo thanh toán bằng tiền mặt
async function createCashPayment(req, res) {
  try {
    const { order_id, amount } = req.body;
    if (!order_id || !amount) {
      return res.status(400).json({ message: "Thiếu order_id hoặc amount" });
    }

    const paymentId = await paymentService.createCashPayment(order_id, amount);
    res.status(201).json({ message: "Thanh toán CASH thành công", paymentId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// 🟨 Lấy danh sách thanh toán theo ORDER_ID
async function getPaymentByOrderId(req, res) {
  try {
    const { orderId } = req.params;
    const payments = await paymentService.getPaymentByOrderId(orderId);

    if (payments.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thanh toán cho ORDER_ID này" });
    }

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createCashPayment,
  getPaymentByOrderId,
};
