// src/controllers/discountController.js
const discountService = require("../services/discountService");

// Hàm trợ giúp trả về lỗi
const handleError = (res, err) => {
  // Mặc định là lỗi 500 nếu không có statusCode
  const statusCode = err.statusCode || 500;
  const message = err.message || "Đã có lỗi máy chủ xảy ra";

  res.status(statusCode).json({
    status: "error",
    message: message,
  });
};

// POST /
const createDiscountHandler = async (req, res) => {
  try {
    const newDiscount = await discountService.createDiscount(req.body);
    res.status(201).json({
      status: "success",
      data: newDiscount,
    });
  } catch (err) {
    handleError(res, err);
  }
};

// GET /
const getAllDiscountsHandler = async (req, res) => {
  try {
    const discounts = await discountService.getAllDiscounts();
    res.status(200).json(discounts);
  } catch (err) {
    handleError(res, err);
  }
};

// GET /:id
const getDiscountByIdHandler = async (req, res) => {
  try {
    const discount = await discountService.getDiscountById(req.params.id);
    res.status(200).json(discount);
  } catch (err) {
    handleError(res, err);
  }
};

// PUT /:id
const updateDiscountHandler = async (req, res) => {
  try {
    const updatedDiscount = await discountService.updateDiscount(
      req.params.id,
      req.body
    );
    res.status(200).json({
      status: "success",
      data: updatedDiscount,
    });
  } catch (err) {
    handleError(res, err);
  }
};

// DELETE /:id
const deleteDiscountHandler = async (req, res) => {
  try {
    await discountService.deleteDiscount(req.params.id);
    res.status(204).json({
      // 204 No Content
      status: "success",
      data: null,
    });
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * [NGHIỆP VỤ CHECK MÃ]
 */
// POST /check
const checkDiscountCodeHandler = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      // Đây là lỗi validation, xử lý ngay tại controller
      return res.status(400).json({
        status: "error",
        message: "Vui lòng cung cấp mã code",
      });
    }

    const discount = await discountService.checkDiscountCode(code);
    res.status(200).json({
      status: "success",
      message: "Mã giảm giá hợp lệ",
      data: discount,
    });
  } catch (err) {
    handleError(res, err);
  }
};

module.exports = {
  createDiscountHandler,
  getAllDiscountsHandler,
  getDiscountByIdHandler,
  updateDiscountHandler,
  deleteDiscountHandler,
  checkDiscountCodeHandler,
};
