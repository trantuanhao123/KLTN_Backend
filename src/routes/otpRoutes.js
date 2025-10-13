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

router.post("/verify-otp", validateVerifyOtp, authController.verifyOtp);
module.exports = router;
