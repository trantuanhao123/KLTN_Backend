const bcrypt = require("bcrypt");
const UserModel = require("../models/user");
const tokenModel = require("../models/passWordResetToken");
const transporter = require("../config/nodemailer");

async function sendOtpForReset(email) {
  const user = await UserModel.findByEmail(email);
  if (!user) return null;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresInMinutes = 5;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Lưu vào DB
  await tokenModel.createToken(user.USER_ID, otp, expiresAt);

  // Gửi mail
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "Mã xác nhận đặt lại mật khẩu",
    text: `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn trong ${expiresInMinutes} phút.`,
  });
  return true;
}

/**
 * Xác thực OTP và đổi mật khẩu
 */
async function verifyOtpAndResetPassword(email, otp, newPassword) {
  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw new Error("Email không tồn tại");
  }
  // 1. Tìm token hợp lệ
  const tokenEntry = await tokenModel.findValidToken(user.USER_ID, otp);

  if (!tokenEntry) {
    throw new Error("OTP không hợp lệ hoặc đã hết hạn");
  }

  // 2. Hash password mới và cập nhật
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await UserModel.resetPassword(user.USER_ID, hashedPassword);

  // 3. Đánh dấu OTP đã dùng
  await tokenModel.markTokenAsUsed(tokenEntry.id);

  return true;
}

module.exports = {
  sendOtpForReset,
  verifyOtpAndResetPassword,
};
