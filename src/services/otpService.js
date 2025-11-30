const bcrypt = require("bcrypt");
const UserModel = require("../models/user");
const tokenModel = require("../models/passWordResetToken");
// const transporter = require("../config/nodemailer");
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; 
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

async function sendOtpForReset(email) {
  const user = await UserModel.findByEmail(email);
  if (!user) return null;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresInMinutes = 5;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Lưu vào DB
  await tokenModel.createToken(user.USER_ID, otp, expiresAt);

  // Gửi mail
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.subject = "Mã xác nhận đặt lại mật khẩu";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Yêu cầu đặt lại mật khẩu</h2>
      <p>Mã OTP của bạn là: <strong style="font-size: 24px; color: #E74C3C;">${otp}</strong></p>
      <p>Mã này sẽ hết hạn trong ${expiresInMinutes} phút.</p>
      <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    </div>`;
  
  // Người gửi 
  sendSmtpEmail.sender = { "name": "KLTN App", "email": process.env.MAIL_SENDER };
  
  // Người nhận
  sendSmtpEmail.to = [{ "email": email }];

  // Gọi API gửi mail 
  apiInstance.sendTransacEmail(sendSmtpEmail).then(
    function(data) {
      console.log('OTP Reset Password sent. ID:', data.messageId);
    },
    function(error) {
      console.error('Error sending OTP Reset Password:', error);
    }
  );

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
