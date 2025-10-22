const rentalOrderService = require("../services/rentalOrderService");

// POST /api/orders (Bước 2)
const handleCreateOrder = async (req, res) => {
  try {
    // Giả sử userId được lấy từ authMiddleware
    const userId = req.user.USER_ID;
    const { carId, startDate, endDate, rentalType, paymentOption } = req.body;

    if (!carId || !startDate || !endDate) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc." });
    }

    const paymentLink = await rentalOrderService.createOrder(
      userId,
      carId,
      startDate,
      endDate,
      rentalType,
      paymentOption
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

// PATCH /api/orders/:id/cancel-confirmed (Bước 6)
const handleCancelConfirmedOrder = async (req, res) => {
  try {
    const userId = req.user.USER_ID;
    const orderId = parseInt(req.params.id);

    const result = await rentalOrderService.cancelConfirmedOrder(
      userId,
      orderId
    );
    return res.status(200).json(result);
  } catch (error) {
    if (
      error.message.includes("Không tìm thấy") ||
      error.message.includes("không ở trạng thái") ||
      error.message.includes("Chỉ hủy được")
    ) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  handleCreateOrder,
  handleCancelPendingOrder,
  handleCronJob,
  handlePickupOrder,
  handleCompleteOrder,
  handleCancelConfirmedOrder,
};
