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
/**
 * [MỚI] GET /api/payments/admin/refunds-pending
 */
const handleAdminGetPendingRefunds = async (req, res) => {
  try {
    const refunds = await paymentService.adminGetPendingRefunds();
    return res.status(200).json(refunds);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * [MỚI] PATCH /api/payments/admin/confirm-refund/:paymentId
 */
const handleAdminConfirmRefund = async (req, res) => {
  try {
    const paymentId = parseInt(req.params.paymentId);
    const adminId = req.USER_ID; // Lấy từ authMiddleware (admin)

    if (isNaN(paymentId)) {
      return res.status(400).json({ error: "PAYMENT_ID không hợp lệ." });
    }

    const result = await paymentService.adminConfirmRefund(paymentId, adminId);
    return res.status(200).json(result);
  } catch (error) {
    if (
      error.message.includes("Không tìm thấy") ||
      error.message.includes("không hợp lệ")
    ) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};
const checkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Chuyển đổi orderId từ string (URL) sang số (nếu CSDL của bạn dùng số)
    // Nếu CSDL của bạn dùng ORDER_ID là số, hãy dùng dòng này
    const numericOrderId = parseInt(orderId);
    if (isNaN(numericOrderId)) {
      return res.status(400).json({ error: "ORDER_ID không hợp lệ." });
    }

    // Nếu CSDL của bạn dùng ORDER_ID là string, hãy dùng dòng này
    // const numericOrderId = orderId;

    if (!numericOrderId) {
      return res.status(400).json({ error: "Thiếu ORDER_ID." });
    }

    const status = await paymentService.getOrderStatus(numericOrderId);
    return res.status(200).json(status);
  } catch (error) {
    if (error.message.includes("Không tìm thấy")) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};
module.exports = {
  handlePayOSWebhook,
  handleAdminGetPendingRefunds,
  handleAdminConfirmRefund,
  checkOrderStatus,
};
