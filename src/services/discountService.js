const discountModel = require("../models/discount");
const { connection } = require("../config/database");

// Hàm trợ giúp tạo lỗi có statusCode
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createDiscount = async (discountData) => {
  // Kiểm tra nghiệp vụ (ví dụ: CODE đã tồn tại chưa)
  const existing = await discountModel.findByCode(discountData.CODE);
  if (existing) {
    throw createError("Mã code này đã tồn tại", 400);
  }

  // (Bạn có thể thêm các logic kiểm tra khác ở đây)

  const discountId = await discountModel.create(discountData);
  return await discountModel.findById(discountId);
};

const getAllDiscounts = async () => {
  return await discountModel.findAll();
};

const getDiscountById = async (id) => {
  const discount = await discountModel.findById(id);
  if (!discount) {
    throw createError("Không tìm thấy mã giảm giá", 404);
  }
  return discount;
};

const updateDiscount = async (id, discountData) => {
  // Kiểm tra xem discount có tồn tại không
  const existing = await discountModel.findById(id);
  if (!existing) {
    throw createError("Không tìm thấy mã giảm giá để cập nhật", 404);
  }

  // Nếu đổi CODE, kiểm tra xem CODE mới có bị trùng không
  if (discountData.CODE && discountData.CODE !== existing.CODE) {
    const duplicate = await discountModel.findByCode(discountData.CODE);
    if (duplicate) {
      throw createError("Mã code mới này đã tồn tại", 400);
    }
  }

  await discountModel.update(id, discountData);
  return await discountModel.findById(id);
};

/**
 * [NGHIỆP VỤ XÓA]
 * Logic kiểm tra trước khi xóa
 */
const deleteDiscount = async (id) => {
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Kiểm tra xem discount có tồn tại không
    const existing = await discountModel.findById(id, conn);
    if (!existing) {
      throw createError("Không tìm thấy mã giảm giá", 404);
    }

    // 2. Kiểm tra xem mã có đang được dùng trong RENTAL_ORDER không
    const isInUse = await discountModel.checkOrderUsage(id, conn);
    if (isInUse) {
      throw createError(
        "Không thể xóa. Mã giảm giá này đã được áp dụng cho một số đơn hàng.",
        400
      );
    }

    // 3. Nếu không, tiến hành xóa
    await discountModel.remove(id, conn);

    await conn.commit();
    return { message: "Xóa mã giảm giá thành công" };
  } catch (error) {
    await conn.rollback();
    throw error; // Ném lỗi (có thể là lỗi DB hoặc lỗi ta tự tạo) ra controller
  } finally {
    conn.release();
  }
};

/**
 * [NGHIỆP VỤ CHECK MÃ]
 * Logic kiểm tra mã giảm giá cho người dùng
 */
const checkDiscountCode = async (code) => {
  // 1. Thử tìm mã HỢP LỆ
  const validDiscount = await discountModel.findValidCode(code);

  // 2. Nếu tìm thấy mã hợp lệ -> trả về
  if (validDiscount) {
    return validDiscount;
  }

  // 3. Nếu không tìm thấy mã hợp lệ, kiểm tra xem mã CÓ TỒN TẠI không
  const existingDiscount = await discountModel.findByCode(code);

  // 4. Nếu mã CÓ TỒN TẠI (nhưng không hợp lệ)
  if (existingDiscount) {
    // Lý do có thể là STATUS ('INACTIVE', 'EXPIRED'), QUANTITY hoặc DATE
    throw createError("Mã giảm giá đã hết hạn hoặc không hợp lệ", 400);
  }

  // 5. Nếu không tồn tại
  throw createError("Mã giảm giá không tồn tại", 404);
};

module.exports = {
  createDiscount,
  getAllDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
  checkDiscountCode,
};
