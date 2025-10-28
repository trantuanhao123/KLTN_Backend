const express = require("express");
const orderController = require("../controllers/rentalOrderController");

const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");

const router = express.Router();

// === User Routes ===
// Yêu cầu: Đã đăng nhập (authMiddleware)
router.get(
  "/login-orders",
  authMiddleware,
  orderController.handleGetLoginUserOrders
);
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
  "/cancel-deposit/:id",
  authMiddleware,
  orderController.handleCancelDepositedOrder
);

// (MỚI)
// Bước 6B: User hủy đơn (khi đã trả 100% - hoàn tiền)
router.patch(
  "/cancel-paid/:id",
  authMiddleware,
  orderController.handleCancelPaidOrder
);
// === Admin Routes ===
// Yêu cầu: Đã đăng nhập (authMiddleware) và là Admin (requireAdmin)

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
// [MỚI] Admin: Lấy tất cả đơn hàng (kèm số lượng giao dịch)
router.get(
  "/",
  authMiddleware,
  requireAdmin,
  orderController.handleAdminGetAllOrders
);

// [MỚI] Admin: Lấy chi tiết 1 đơn hàng (kèm danh sách giao dịch)
router.get(
  "/:id",
  authMiddleware,
  requireAdmin,
  orderController.handleAdminGetOrderById
);

// [MỚI] Admin: Xóa cứng 1 đơn hàng
router.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  orderController.handleAdminHardDeleteOrder
);

// [MỚI] Admin: Lấy lịch sử thuê của một user cụ thể
router.get(
  "/user/:userId",
  authMiddleware,
  requireAdmin,
  orderController.handleAdminGetUserOrders
);

// [MỚI] Admin: Tự tạo đơn (Manual Order)
router.post(
  "/admin/create",
  authMiddleware,
  requireAdmin,
  orderController.handleAdminCreateManualOrder
);

// [MỚI] Admin: Cập nhật/sửa đơn hàng
router.patch(
  "/admin/update/:id",
  authMiddleware,
  requireAdmin,
  orderController.handleAdminUpdateOrder
);
// === System Routes ===
// (Không cần auth, nhưng nên có secret key)

// Bước 3, TH2: Cron job
router.post("/webhook/cron", orderController.handleCronJob);
// User đổi ngày thuê
router.patch(
  "/change-date/:id",
  authMiddleware,
  orderController.handleChangeRentalDate
);
module.exports = router;
