// middleware/validateRequest.js
const Joi = require("joi");

// Schema cho yêu cầu gửi OTP
const requestResetSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email phải là địa chỉ email hợp lệ.",
    "any.required": "Email là bắt buộc.",
  }),
});

// Schema cho xác thực OTP và đổi mật khẩu
const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "Mã OTP phải có 6 chữ số.",
      "string.pattern": "Mã OTP chỉ được chứa chữ số.",
    }),
  newPassword: Joi.string().min(8).required().messages({
    "string.min": "Mật khẩu mới phải có ít nhất 8 ký tự.",
  }),
});

/**
 * Middleware kiểm tra dữ liệu cho /request-reset (chỉ email)
 */
exports.validateRequestReset = (req, res, next) => {
  const { error } = requestResetSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

/**
 * Middleware kiểm tra dữ liệu cho /verify-otp (email, otp, newPassword)
 */
exports.validateVerifyOtp = (req, res, next) => {
  const { error } = verifyOtpSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};
