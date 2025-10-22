const paymentService = require("../services/paymentService");

// POST /api/payments/webhook/payos (Bước 3, TH1)
const handlePayOSWebhook = async (req, res) => {
  try {
    // req.body chứa toàn bộ data PayOS gửi
    await paymentService.handlePayOSWebhook(req.body);

    // Phải trả 200 OK để PayOS biết đã nhận
    return res
      .status(200)
      .json({ success: true, message: "Webhook received." });
  } catch (error) {
    console.error("LỖI WEBHOOK CONTROLLER:", error.message);

    // Nếu lỗi xác thực, trả 400
    if (error.message.includes("Invalid Signature")) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid Signature." });
    }

    // Các lỗi 500 (lỗi DB, ...)
    return res
      .status(500)
      .json({ success: false, error: "Internal processing error." });
  }
};

module.exports = {
  handlePayOSWebhook,
};
