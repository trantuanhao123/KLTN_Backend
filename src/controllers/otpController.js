// controllers/authController.js
const otpService = require("../services/otpService");

/**
 * Endpoint: POST /api/auth/request-reset
 * Logic: Nhận email, gọi Service gửi OTP qua mail.
 */
async function requestReset(req, res) {
  const { email } = req.body;

  try {
    const result = await otpService.sendOtpForReset(email);

    if (!result) {
      // Theo yêu cầu của bạn, trả về lỗi 404 nếu email không tồn tại.
      return res
        .status(404)
        .json({ message: "Email không tồn tại trong hệ thống." });
    }

    res.json({
      success: true,
      message: "Đã gửi mã OTP tới email. Vui lòng kiểm tra hộp thư.",
    });
  } catch (error) {
    console.error("Lỗi Controller khi gửi OTP:", error);
    // Lỗi DB hoặc lỗi gửi mail
    res
      .status(500)
      .json({ message: "Đã xảy ra lỗi trong quá trình xử lý yêu cầu." });
  }
}

async function verifyOtp(req, res) {
  const { email, otp, newPassword } = req.body;

  try {
    await otpService.verifyOtpAndResetPassword(email, otp, newPassword);

    res.json({ message: "Đặt lại mật khẩu thành công." });
  } catch (error) {
    // Xử lý các lỗi nghiệp vụ (Business Logic Errors) ném ra từ Service
    if (error.message.includes("Email không tồn tại")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("OTP không hợp lệ")) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Lỗi Controller khi xác thực OTP:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi hệ thống." });
  }
}

module.exports = {
  requestReset,
  verifyOtp,
};
