const express = require("express");
const router = express.Router();
const authController = require("../controllers/otpController");
const {
  validateRequestReset,
  validateVerifyOtp,
} = require("../middlewares/validateRequest");
router.post(
  "/request-reset",
  validateRequestReset, // ⬅️ Middleware kiểm tra Joi
  authController.requestReset
);

// POST /api/auth/verify-otp
// Nhận email, OTP, mật khẩu mới, xác thực và đổi mật khẩu
router.post(
  "/verify-otp",
  validateVerifyOtp, // ⬅️ Middleware kiểm tra Joi
  authController.verifyOtp
);
module.exports = router;
