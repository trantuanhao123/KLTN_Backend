const express = require("express");
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");
const router = express.Router();

// Bước 3, TH1: Endpoint nhận Webhook từ PayOS
router.post("/webhook/payos", paymentController.handlePayOSWebhook);
// [MỚI] Admin: Lấy danh sách chờ hoàn tiền
router.get(
  "/refunds-pending",
  authMiddleware,
  requireAdmin,
  paymentController.handleAdminGetPendingRefunds
);

// [MỚI] Admin: Xác nhận đã hoàn tiền
router.patch(
  "/confirm-refund/:paymentId",
  authMiddleware,
  requireAdmin,
  paymentController.handleAdminConfirmRefund
);
module.exports = router;
