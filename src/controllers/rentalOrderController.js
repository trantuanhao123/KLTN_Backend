const rentalOrderService = require("../services/rentalOrderService");

/**
 * [MỚI] (User) Lấy danh sách đơn hàng của chính mình
 */
const handleGetLoginUserOrders = async (req, res) => {
  try {
    // Lấy userId từ JWT (đã qua authMiddleware)
    const userId = req.user.USER_ID;

    const orders = await rentalOrderService.getLoginUserOrders(userId);

    return res.status(200).json(orders);
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Lỗi hệ thống, vui lòng thử lại sau." });
  }
};
// POST /api/orders (Bước 2)
const handleCreateOrder = async (req, res) => {
  try {
    // Giả sử userId được lấy từ authMiddleware
    const userId = req.user.USER_ID;
    const {
      carId,
      startDate,
      endDate,
      rentalType,
      paymentOption,
      discountCode,
    } = req.body;

    if (!carId || !startDate || !endDate) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc." });
    }

    const paymentLink = await rentalOrderService.createOrder(
      userId,
      carId,
      startDate,
      endDate,
      rentalType,
      paymentOption,
      discountCode
    );

    return res.status(201).json(paymentLink);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// PATCH /api/orders/:id/cancel-pending (Bước 3, TH3)
const handleCancelPendingOrder = async (req, res) => {
  try {
    const userId = req.user.USER_ID;
    const orderId = parseInt(req.params.id);

    const result = await rentalOrderService.cancelPendingOrder(userId, orderId);
    return res.status(200).json(result);
  } catch (error) {
    // Lỗi 404 (không tìm thấy) hoặc 403 (không có quyền)
    if (
      error.message.includes("Không tìm thấy") ||
      error.message.includes("Không có quyền") ||
      error.message.includes("Không thể hủy")
    ) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/orders/webhook/cron (Bước 3, TH2 - Dùng cho Cron)
// (Endpoint này nên được bảo vệ bằng secret key)
const handleCronJob = async (req, res) => {
  try {
    // Đảm bảo chỉ có hệ thống mới gọi được
    if (req.headers["x-cron-secret"] !== process.env.CRON_SECRET) {
      return res.status(403).json({ error: "Forbidden" });
    }
    // Chạy ngầm, không cần await
    rentalOrderService.processExpiredOrders();
    return res.status(202).json({ message: "Cron job triggered." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// PATCH /api/orders/:id/pickup (Bước 4 - Admin)
const handlePickupOrder = async (req, res) => {
  try {
    const adminId = req.USER_ID; // Lấy từ authMiddleware (admin)
    const orderId = parseInt(req.params.id);
    const { cashAmount } = req.body; // Tiền mặt thu (nếu là đơn cọc)

    const result = await rentalOrderService.confirmOrderPickup(
      orderId,
      adminId,
      { amount: cashAmount }
    );
    return res.status(200).json(result);
  } catch (error) {
    if (
      error.message.includes("Không tìm thấy") ||
      error.message.includes("không ở trạng thái")
    ) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};

// PATCH /api/orders/:id/complete (Bước 5 - Admin)
const handleCompleteOrder = async (req, res) => {
  try {
    const adminId = req.USER_ID; // Lấy từ authMiddleware (admin)
    const orderId = parseInt(req.params.id);
    const { extraFee, note, carStatus } = req.body;

    const result = await rentalOrderService.completeOrder(
      orderId,
      adminId,
      extraFee,
      note,
      carStatus
    );
    return res.status(200).json(result);
  } catch (error) {
    if (
      error.message.includes("Không tìm thấy") ||
      error.message.includes("không ở trạng thái")
    ) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};

// PATCH /api/orders/:id/cancel-deposit (Bước 6A)
const handleCancelDepositedOrder = async (req, res) => {
  try {
    const userId = req.user.USER_ID;
    const orderId = parseInt(req.params.id);

    const result = await rentalOrderService.cancelDepositedOrder(
      userId,
      orderId
    );
    return res.status(200).json(result);
  } catch (error) {
    if (
      error.message.includes("Không tìm thấy") ||
      error.message.includes("không ở trạng thái") ||
      error.message.includes("Chỉ hủy được") ||
      error.message.includes("chỉ dùng để hủy đơn đã đặt cọc") // Lỗi mới
    ) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};

// (MỚI)
// PATCH /api/orders/:id/cancel-paid (Bước 6B)
const handleCancelPaidOrder = async (req, res) => {
  try {
    const userId = req.user.USER_ID;
    const orderId = parseInt(req.params.id);

    // [SỬA] Lấy thông tin hoàn tiền từ body
    const { bankAccount, bankName } = req.body;

    // [SỬA] Validate input STK
    if (!bankAccount || !bankName) {
      return res.status(400).json({
        error: "Vui lòng cung cấp Số tài khoản và Tên ngân hàng để hoàn tiền.",
      });
    }

    const refundInfo = { bankAccount, bankName };

    // [SỬA] Truyền thêm refundInfo vào service
    const result = await rentalOrderService.cancelPaidOrder(
      userId,
      orderId,
      refundInfo
    );

    return res.status(200).json(result);
  } catch (error) {
    if (
      error.message.includes("Không tìm thấy") ||
      error.message.includes("không ở trạng thái") ||
      error.message.includes("Chỉ hủy được") ||
      error.message.includes("chỉ dùng để hủy đơn đã thanh toán") ||
      error.message.includes("Vui lòng cung cấp") // [SỬA] Bắt lỗi validate mới
    ) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};

/**
 * [MỚI] GET /api/orders/admin/all (Admin)
 */
const handleAdminGetAllOrders = async (req, res) => {
  try {
    const orders = await rentalOrderService.adminGetAllOrders();
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * [MỚI] GET /api/orders/admin/:id (Admin)
 */
const handleAdminGetOrderById = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const orderDetails = await rentalOrderService.adminGetOrderById(orderId);
    return res.status(200).json(orderDetails);
  } catch (error) {
    if (error.message.includes("Không tìm thấy")) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};

/**
 * [MỚI] DELETE /api/orders/admin/:id (Admin)
 */
const handleAdminHardDeleteOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const adminId = req.USER_ID; // Lấy từ authMiddleware (admin)

    const result = await rentalOrderService.adminHardDeleteOrder(
      orderId,
      adminId
    );
    return res.status(200).json(result);
  } catch (error) {
    if (error.message.includes("Không tìm thấy")) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};

/**
 * [MỚI] GET /api/orders/admin/user/:userId (Admin)
 */
const handleAdminGetUserOrders = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "USER_ID không hợp lệ." });
    }
    const orders = await rentalOrderService.adminGetUserOrders(userId);
    return res.status(200).json(orders);
  } catch (error) {
    if (error.message.includes("Không tìm thấy")) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};

/**
 * [MỚI] POST /api/orders/admin/manual-create (Admin)
 */
const handleAdminCreateManualOrder = async (req, res) => {
  try {
    const adminId = req.USER_ID; // Lấy từ authMiddleware (admin)
    const orderDetails = req.body;

    // (Thêm validate chi tiết cho orderDetails ở đây)
    if (!orderDetails.userId || !orderDetails.carId) {
      return res.status(400).json({ error: "Thiếu thông tin User hoặc Xe." });
    }

    const result = await rentalOrderService.adminCreateManualOrder(
      adminId,
      orderDetails
    );
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * [MỚI] PATCH /api/orders/admin/update/:id (Admin)
 */
const handleAdminUpdateOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const updateData = req.body;

    const result = await rentalOrderService.adminUpdateOrder(
      orderId,
      updateData
    );
    return res.status(200).json(result);
  } catch (error) {
    if (
      error.message.includes("Không tìm thấy") ||
      error.message.includes("không hợp lệ") ||
      error.message.includes("không khả dụng")
    ) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes("Chỉ có thể cập nhật")) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};
const handleChangeRentalDate = async (req, res) => {
  try {
    const userId = req.user.USER_ID;
    const orderId = parseInt(req.params.id);
    const { newStartDate, newEndDate } = req.body;

    if (!newStartDate || !newEndDate) {
      return res
        .status(400)
        .json({ error: "Vui lòng cung cấp ngày bắt đầu và kết thúc mới." });
    }

    const result = await rentalOrderService.changeRentalDate(
      userId,
      orderId,
      newStartDate,
      newEndDate
    );

    return res.status(200).json(result);
  } catch (error) {
    // 400 Bad Request (Lỗi do người dùng nhập sai)
    if (
      error.message.includes("quá khứ") || // "Bạn không thể đổi lịch thuê về thời điểm trong quá khứ."
      error.message.includes("Thời lượng thuê") || // "Thời lượng thuê mới phải bằng..."
      error.message.includes("không hợp lệ") || // "Ngày tháng bạn chọn không hợp lệ."
      error.message.includes("Chỉ có thể đổi ngày") // "Bạn chỉ có thể đổi ngày cho các đơn hàng..."
    ) {
      return res.status(400).json({ error: error.message });
    }

    // 404/403 (Không tìm thấy hoặc không có quyền)
    if (
      error.message.includes("Không tìm thấy") || // "Không tìm thấy đơn hàng này."
      error.message.includes("không có quyền") // "Bạn không có quyền thay đổi đơn hàng này."
    ) {
      return res.status(404).json({ error: error.message });
    }

    // 500 Lỗi chung
    return res
      .status(500)
      .json({ error: "Lỗi hệ thống, vui lòng thử lại sau." });
  }
};

module.exports = {
  handleGetLoginUserOrders,
  handleCreateOrder,
  handleCancelPendingOrder,
  handleCronJob,
  handlePickupOrder,
  handleCompleteOrder,
  handleCancelDepositedOrder,
  handleCancelPaidOrder,
  handleAdminGetAllOrders,
  handleAdminGetOrderById,
  handleAdminHardDeleteOrder,
  handleAdminGetUserOrders,
  handleAdminCreateManualOrder,
  handleAdminUpdateOrder,
  handleChangeRentalDate,
};
