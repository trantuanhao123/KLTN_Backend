const ReviewModel = require("../models/review");
const RentalOrderModel = require("../models/rentalOrder");
const NotificationModel = require("../models/notification");
const UserModel = require("../models/user");

const { connection } = require("../config/database");

/**
 * Tạo đánh giá mới
 */
const createReview = async (orderId, userId, rating, content) => {
  let conn = null;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    // 1. Kiểm tra Order
    const order = await RentalOrderModel.findById(orderId, conn);
    if (!order) {
      throw new Error("Không tìm thấy đơn hàng.");
    }

    // Ràng buộc 2a: User ID phải khớp với người thuê xe
    if (order.USER_ID !== userId) {
      throw new Error(
        "Không được phép: Bạn không phải là khách hàng của đơn hàng này."
      );
    }

    // Ràng buộc 2b: Đơn hàng phải ở trạng thái COMPLETED
    if (order.STATUS !== "COMPLETED") {
      throw new Error(
        "Nghiệp vụ: Chỉ đơn hàng ĐÃ HOÀN THÀNH mới có thể được đánh giá."
      );
    }

    // 2. Kiểm tra Đã Review (Ràng buộc 1)
    const existingReview = await ReviewModel.findByOrderId(orderId, conn);
    if (existingReview) {
      throw new Error("Nghiệp vụ: Đơn hàng này đã được đánh giá rồi.");
    }

    // 3. Thực hiện tạo review
    const reviewData = {
      carId: order.CAR_ID,
      userId: userId,
      orderId: orderId,
      rating: rating,
      content: content,
    };
    const reviewId = await ReviewModel.create(reviewData, conn);

    // 4. Cập nhật RATING trung bình của xe
    await ReviewModel.recalculateCarRating(order.CAR_ID, conn);

    // 5. Gửi thông báo cho Admin nếu đánh giá thấp (1-2 sao)
    if (rating <= 2) {
      const adminUser = await UserModel.findByRole("ADMIN", conn);
      if (adminUser) {
        await NotificationModel.create(
          {
            USER_ID: adminUser.USER_ID,
            TITLE: `Đánh giá 1-2 sao (Đơn: ${order.ORDER_CODE})`,
            CONTENT: `Người dùng (ID: ${userId}) vừa đánh giá ${rating} sao cho xe (ID: ${order.CAR_ID}) với nội dung: "${content}". Vui lòng kiểm tra.`,
          },
          conn
        );
      }
    }

    await conn.commit();
    return reviewId;
  } catch (error) {
    if (conn) await conn.rollback();
    throw error;
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Cập nhật đánh giá
 */
const updateReview = async (reviewId, userId, rating, content, userRole) => {
  let conn = null;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    const review = await ReviewModel.findById(reviewId, conn);
    if (!review) {
      throw new Error("Không tìm thấy đánh giá.");
    }

    // Ràng buộc 4 (Phân quyền)
    if (review.USER_ID !== userId && userRole !== "ADMIN") {
      throw new Error(
        "Không được phép: Chỉ chủ sở hữu đánh giá hoặc quản trị viên mới có thể cập nhật."
      );
    }

    // Thực hiện cập nhật
    const affectedRows = await ReviewModel.update(
      reviewId,
      rating,
      content,
      conn
    );

    // Cập nhật RATING trung bình của xe
    if (affectedRows > 0) {
      await ReviewModel.recalculateCarRating(review.CAR_ID, conn);
    }

    // 6. Gửi thông báo cho Admin nếu đánh giá thấp (1-2 sao)
    if (rating <= 2) {
      const adminUser = await UserModel.findByRole("ADMIN", conn);
      if (adminUser) {
        // Lấy thông tin đơn hàng để thông báo rõ ràng hơn
        const order = await RentalOrderModel.findById(review.ORDER_ID, conn);
        const orderCode = order ? order.ORDER_CODE : review.ORDER_ID;
        const licensePlate = order ? order.LICENSE_PLATE : "N/A";

        await NotificationModel.create(
          {
            USER_ID: adminUser.USER_ID,
            TITLE: `Cập nhật đánh giá 1-2 sao (Đơn: ${orderCode})`,
            CONTENT: `Người dùng (ID: ${userId}) vừa cập nhật đánh giá ${rating} sao cho xe (ID: ${review.CAR_ID}) với nội dung: "${content}".`,
          },
          conn
        );
      }
    }

    await conn.commit();
    return affectedRows;
  } catch (error) {
    if (conn) await conn.rollback();
    throw error;
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Xóa đánh giá
 */
const deleteReview = async (reviewId, userId, userRole) => {
  let conn = null;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    const review = await ReviewModel.findById(reviewId, conn);
    if (!review) {
      // Nếu không tìm thấy, coi như thành công
      return 0;
    }

    // Ràng buộc 4 (Phân quyền)
    if (review.USER_ID !== userId && userRole !== "ADMIN") {
      throw new Error(
        "Không được phép: Chỉ chủ sở hữu đánh giá hoặc quản trị viên mới có thể xóa."
      );
    }

    const carId = review.CAR_ID;

    // Thực hiện xóa
    const affectedRows = await ReviewModel.remove(reviewId, conn);

    // Cập nhật RATING trung bình của xe sau khi xóa
    await ReviewModel.recalculateCarRating(carId, conn);

    await conn.commit();
    return affectedRows;
  } catch (error) {
    if (conn) await conn.rollback();
    throw error;
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getReviewById: ReviewModel.findById,
  getReviewsByCarId: ReviewModel.findByCarId,
};
