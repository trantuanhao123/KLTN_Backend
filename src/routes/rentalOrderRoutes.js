const express = require("express");
const orderController = require("../controllers/rentalOrderController");

// ✅ Import 2 middleware của bạn (đều là hàm)
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin"); // (Đảm bảo đường dẫn này đúng)

const router = express.Router();

// === User Routes ===
// Yêu cầu: Đã đăng nhập (authMiddleware)

// Bước 2: Tạo đơn hàng
router.post("/", authMiddleware, orderController.handleCreateOrder);

// Bước 3, TH3: User tự hủy đơn (khi chưa thanh toán)
router.patch(
  "/:id/cancel-pending",
  authMiddleware,
  orderController.handleCancelPendingOrder
);

// Bước 6: User hủy đơn (khi đã thanh toán)
router.patch(
  "/:id/cancel-confirmed",
  authMiddleware,
  orderController.handleCancelConfirmedOrder
);

// === Admin Routes ===
// Yêu cầu: Đã đăng nhập (authMiddleware) VÀ là Admin (requireAdmin)

// Bước 4: Admin xác nhận bàn giao xe
router.patch(
  "/:id/pickup",
  authMiddleware,
  requireAdmin, // Kiểm tra admin
  orderController.handlePickupOrder
);

// Bước 5: Admin xác nhận trả xe
router.patch(
  "/:id/complete",
  authMiddleware,
  requireAdmin, // Kiểm tra admin
  orderController.handleCompleteOrder
);

// === System Routes ===
// (Không cần auth, nhưng nên có secret key)

// Bước 3, TH2: Cron job
router.post("/webhook/cron", orderController.handleCronJob);

module.exports = router;
