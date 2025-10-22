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
  "/cancel-pending/:id",
  authMiddleware,
  orderController.handleCancelPendingOrder
);

// (CẬP NHẬT)
// Bước 6A: User hủy đơn (khi đã cọc - mất cọc)
router.patch(
  "/cancel-deposit/:id", // <-- Đổi tên route
  authMiddleware,
  orderController.handleCancelDepositedOrder // <-- Đổi tên controller
);

// (MỚI)
// Bước 6B: User hủy đơn (khi đã trả 100% - hoàn tiền)
router.patch(
  "/cancel-paid/:id", // <-- Route mới
  authMiddleware,
  orderController.handleCancelPaidOrder // <-- Controller mới
);
// === Admin Routes ===
// Yêu cầu: Đã đăng nhập (authMiddleware) VÀ là Admin (requireAdmin)

// Bước 4: Admin xác nhận bàn giao xe
router.patch(
  "/pickup/:id",
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
