const express = require("express");
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

/**
 * POST /api/reviews
 * Chức năng: Tạo đánh giá cho một đơn hàng (chỉ CUSTOMER đã đăng nhập)
 * Ràng buộc: Order phải thuộc về User, trạng thái COMPLETED, và chưa có review.
 */
router.post("/", authMiddleware, reviewController.createReview);

/**
 * GET /api/reviews/car/:carId
 * Chức năng: Lấy tất cả đánh giá của một xe (PUBLIC)
 */
router.get("/car/:carId", reviewController.getReviewsByCar);

/**
 * Chức năng: Cập nhật đánh giá (Chủ sở hữu hoặc Admin)
 */
router.put("/:reviewId", authMiddleware, reviewController.updateReview);

/**
 * DELETE /api/reviews/:reviewId
 */
router.delete("/:reviewId", authMiddleware, reviewController.deleteReview);

module.exports = router;
