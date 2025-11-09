const reviewService = require("../services/reviewService");

/**
 * POST /api/reviews - Tạo đánh giá mới (dành cho Customer)
 */
const createReview = async (req, res) => {
  const { orderId, rating, content } = req.body;
  const userId = req.user.USER_ID;

  // Ràng buộc 3: Xác thực đầu vào cơ bản (Sửa thông báo Tiếng Việt)
  if (!orderId || !rating || rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ error: "Mã đơn hàng và điểm đánh giá (1-5) là bắt buộc." });
  }

  try {
    const reviewId = await reviewService.createReview(
      orderId,
      userId,
      rating,
      content
    );
    res.status(201).json({
      message: "Đánh giá được tạo thành công",
      reviewId,
    });
  } catch (error) {
    // Xử lý các lỗi nghiệp vụ từ Service (Kiểm tra chuỗi Tiếng Việt)
    if (
      error.message.includes("Không tìm thấy đơn hàng") ||
      error.message.includes("Không được phép") ||
      error.message.includes("Nghiệp vụ:") // Bắt tất cả các lỗi nghiệp vụ (Đã hoàn thành, Đã review)
    ) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Lỗi khi tạo đánh giá:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

/**
 * GET /api/reviews/car/:carId - Lấy danh sách đánh giá theo xe (Public)
 */
const getReviewsByCar = async (req, res) => {
  const { carId } = req.params;
  try {
    const reviews = await reviewService.getReviewsByCarId(carId);
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Lỗi khi lấy đánh giá theo xe:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

/**
 * PUT /api/reviews/:reviewId - Cập nhật đánh giá (Chủ sở hữu hoặc Admin)
 */
const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, content } = req.body;
  const userId = req.user.USER_ID;
  const userRole = req.user.ROLE;

  // Ràng buộc 3: Xác thực đầu vào cơ bản (Sửa thông báo Tiếng Việt)
  if (!rating || rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ error: "Điểm đánh giá phải nằm trong khoảng từ 1 đến 5." });
  }

  try {
    const affectedRows = await reviewService.updateReview(
      reviewId,
      userId,
      rating,
      content,
      userRole
    );

    if (affectedRows === 0) {
      // Trường hợp không tìm thấy sẽ được bắt ở khối catch dưới
      return res
        .status(400) // 400 vì không tìm thấy nhưng không báo 404 để không lộ thông tin
        .json({
          error: "Đánh giá không được tìm thấy hoặc không có thay đổi.",
        });
    }
    res.status(200).json({ message: "Đánh giá được cập nhật thành công." });
  } catch (error) {
    // Xử lý lỗi từ Service (Kiểm tra chuỗi Tiếng Việt)
    if (error.message.includes("Không tìm thấy đánh giá")) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes("Không được phép:")) {
      return res.status(403).json({ error: error.message });
    }
    console.error("Lỗi khi cập nhật đánh giá:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

/**
 * DELETE /api/reviews/:reviewId - Xóa đánh giá (Chủ sở hữu hoặc Admin)
 */
const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.USER_ID;
  const userRole = req.user.ROLE;

  try {
    const affectedRows = await reviewService.deleteReview(
      reviewId,
      userId,
      userRole
    );

    if (affectedRows === 0) {
      // Nếu không phải ADMIN, không tìm thấy tức là lỗi 404
      if (userRole !== "ADMIN") {
        return res
          .status(404)
          .json({ error: "Không tìm thấy đánh giá để xóa." });
      }
      // Nếu là ADMIN, xóa 0 dòng có thể là do đã xóa rồi, vẫn báo thành công (200)
    }
    res.status(200).json({ message: "Đánh giá đã được xóa thành công." });
  } catch (error) {
    // Xử lý lỗi phân quyền (Kiểm tra chuỗi Tiếng Việt)
    if (error.message.includes("Không được phép:")) {
      return res.status(403).json({ error: error.message });
    }
    console.error("Lỗi khi xóa đánh giá:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

module.exports = {
  createReview,
  getReviewsByCar,
  updateReview,
  deleteReview,
};
