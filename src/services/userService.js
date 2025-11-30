const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user");
const OtpModel = require("../models/verifiedEmail");
const notificationModel = require("../models/notification");
// const transporter = require("../config/nodemailer");
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; 
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

async function register({ email, phone, password, fullname }) {
  const existingUser = await UserModel.findByEmail(email);

  if (existingUser && existingUser.IS_EMAIL_VERIFIED) {
    throw new Error("Email đã được đăng ký");
  }
  if (existingUser && existingUser.IS_DELETED) {
    throw new Error("Email này đã bị khóa và không thể đăng ký lại.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let userId;

  if (existingUser && !existingUser.IS_EMAIL_VERIFIED) {
    // 2. User tồn tại NHƯNG CHƯA XÁC THỰC EMAIL
    userId = existingUser.USER_ID;
    await UserModel.updateUnverifiedUser(userId, {
      phone,
      passwordHash,
      fullname,
    });
    await OtpModel.clearAllForUser(userId); // Xóa OTP cũ
  } else {
    // 3. User hoàn toàn mới
    userId = await UserModel.create({
      email,
      phone,
      passwordHash,
      fullname,
    });
  }

  // 4. Tạo và gửi OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

  await OtpModel.createToken(userId, otp, expiresAt);

  // transporter.sendMail({
  //   from: process.env.MAIL_USER,
  //   to: email,
  //   subject: "Mã xác nhận đăng ký tài khoản",
  //   text: `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn trong 10 phút.`,
  // }).catch(err => console.error("Lỗi gửi mail ngầm:", err)); 
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = "Mã xác nhận đăng ký tài khoản";
  sendSmtpEmail.htmlContent = `<html><body><p>Mã OTP của bạn là: <strong>${otp}</strong>. Mã này sẽ hết hạn trong 10 phút.</p></body></html>`;
  sendSmtpEmail.sender = { "name": "KLTN App", "email": process.env.MAIL_SENDER };
  sendSmtpEmail.to = [{ "email": email }];

  apiInstance.sendTransacEmail(sendSmtpEmail).then(
    function(data) {
      console.log('Brevo: Gửi mail thành công. MessageId: ' + data.messageId);
    },
    function(error) {
      console.error('Brevo: Lỗi gửi mail:', error);
    }
  );

  return {
    message: "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.",
    userId: userId,
  };
}
async function verifyRegistration({ email, otp }) {
  const user = await UserModel.findByEmail(email);

  if (!user) throw new Error("Email không tồn tại");
  if (user.IS_EMAIL_VERIFIED)
    throw new Error("Tài khoản đã được xác minh trước đó");

  // 1. Tìm OTP hợp lệ (Dùng OtpModel)
  const tokenEntry = await OtpModel.findValidToken(user.USER_ID, otp);

  if (!tokenEntry) {
    throw new Error("OTP không hợp lệ hoặc đã hết hạn");
  }

  // 2. Cập nhật User (IS_EMAIL_VERIFIED = 1)
  await UserModel.setEmailAsVerified(user.USER_ID);

  // 3. Đánh dấu OTP đã dùng (Dùng OtpModel)
  await OtpModel.markTokenAsUsed(tokenEntry.id);

  // 4. Lấy thông tin user mới nhất
  const verifiedUser = await UserModel.findById(user.USER_ID);

  // 5. Tạo token
  const token = jwt.sign(
    { userId: verifiedUser.USER_ID, role: verifiedUser.ROLE },
    process.env.JWT_SECRET || "khongdoanduocdau",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );

  return { token, user: verifiedUser };
}

async function login({ email, password }) {
  const user = await UserModel.findByEmail(email);
  if (!user) throw new Error("Sai tài khoản hoặc mật khẩu");
  if (user.IS_DELETED) throw new Error("Tài khoản này đã bị khóa");
  if (!user.IS_EMAIL_VERIFIED) {
    throw new Error("Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.");
  }
  const valid = await bcrypt.compare(password, user.PASSWORD_HASH);
  if (!valid) throw new Error("Sai tài khoản hoặc mật khẩu");

  const token = jwt.sign(
    { userId: user.USER_ID, role: user.ROLE },
    process.env.JWT_SECRET || "khongdoanduocdau",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );

  const userInfo = {
    USER_ID: user.USER_ID,
    EMAIL: user.EMAIL,
    PHONE: user.PHONE,
    ROLE: user.ROLE,
    VERIFIED: user.VERIFIED, // Lưu ý: Đảm bảo trường này khớp với DB (IS_EMAIL_VERIFIED hay VERIFIED)
    PROVIDER: user.PROVIDER,
    FULLNAME: user.FULLNAME,
    BIRTHDATE: user.BIRTHDATE,
    AVATAR_URL: user.AVATAR_URL,
    ADDRESS: user.ADDRESS,
    ID_CARD: user.ID_CARD,
    LICENSE_FRONT_URL: user.LICENSE_FRONT_URL,
    LICENSE_BACK_URL: user.LICENSE_BACK_URL,
    RATING: user.RATING,
    CREATED_AT: user.CREATED_AT,
  };

  return { token, user: userInfo };
}

async function loginAdmin({ email, password }) {
  // 1. Tìm người dùng bằng email
  const user = await UserModel.findByEmail(email);

  // Kiểm tra nếu không tìm thấy người dùng
  if (!user) throw new Error("Sai tài khoản hoặc mật khẩu");

  // 2. So sánh mật khẩu
  const valid = await bcrypt.compare(password, user.PASSWORD_HASH);
  if (!valid) throw new Error("Sai tài khoản hoặc mật khẩu");

  // 3. KIỂM TRA VAI TRÒ ĐẶC BIỆT
  if (user.ROLE !== "ADMIN") {
    throw new Error("Từ chối truy cập. Người dùng không phải quản trị viên");
  }

  const token = jwt.sign(
    { userId: user.USER_ID, role: user.ROLE },
    process.env.JWT_SECRET || "khongdoanduocdau",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );

  // 4. Đăng nhập thành công, trả về thông tin Admin
  return {
    user: {
      USER_ID: user.USER_ID,
      EMAIL: user.EMAIL,
      FULLNAME: user.FULLNAME,
      ROLE: user.ROLE,
    },
    token,
  };
}
// Lấy danh sách người dùng
async function getAllUsers() {
  const users = await UserModel.getAll();
  return users;
}

// Lấy thông tin người dùng theo ID
async function getUserById(userId) {
  const user = await UserModel.findById(userId);
  if (!user || user.IS_DELETED) throw new Error("Người dùng không tồn tại");
  return user;
}

// Cập nhật thông tin người dùng
async function updateUserProfile(userId, profileData) {
  const affectedRows = await UserModel.updateProfileInfo(userId, profileData);

  if (affectedRows === 0) {
    throw new Error("Cập nhật thông tin thất bại hoặc không có gì thay đổi.");
  }

  // Trả về thông tin người dùng đã được làm mới
  return await UserModel.findById(userId);
}

// 2. Cập nhật ảnh đại diện (Avatar)
async function updateUserAvatar(userId, avatarUrl) {
  const affectedRows = await UserModel.updateAvatar(userId, avatarUrl);

  if (affectedRows === 0) {
    throw new Error("Cập nhật ảnh đại diện thất bại.");
  }

  // Trả về thông tin người dùng đã được làm mới
  return await UserModel.findById(userId);
}

// 3. Cập nhật bằng lái xe (License)
async function updateUserLicense(userId, licenseUrls) {
  const affectedRows = await UserModel.updateLicense(userId, licenseUrls);

  if (affectedRows === 0) {
    throw new Error("Cập nhật thông tin bằng lái xe thất bại.");
  }

  // Lấy thông tin người dùng sau khi cập nhật thành công
  const updatedUser = await UserModel.findById(userId);

  // --- BỔ SUNG LOGIC THÔNG BÁO CHO ADMIN (ĐÃ ĐƠN GIẢN HÓA) ---
  try {
    const adminUser = await UserModel.findByRole("ADMIN");

    if (adminUser && adminUser.USER_ID) {
      // Thông báo đơn giản: Đã cập nhật, đợi xác minh.
      await notificationModel.create({
        USER_ID: adminUser.USER_ID, // Gửi cho Admin
        TITLE: `Hồ sơ KYC mới cần kiểm tra`,
        CONTENT: `Người dùng ${
          updatedUser.FULLNAME || updatedUser.EMAIL
        } (ID: ${userId}) vừa cập nhật bằng lái xe. Vui lòng xác minh hồ sơ.`,
      });
    } else {
      console.warn(
        "Không tìm thấy ADMIN user để gửi thông báo bằng lái xe mới."
      );
    }
  } catch (notificationError) {
    console.error(
      "LỖI GỬI THÔNG BÁO ADMIN sau khi cập nhật bằng lái:",
      notificationError
    );
  }
  return updatedUser;
}

// Xóa người dùng (soft delete)
async function deleteUser(userId) {
  const affected = await UserModel.deleteById(userId);
  if (!affected) throw new Error("Không thể xóa người dùng");
  return true;
}

async function reActiveUser(userId) {
  const affected = await UserModel.reActiveById(userId);
  if (!affected) throw new Error("Không thể xóa người dùng");
  return true;
}
// Xác minh tài khoản (VERIFIED = 1)
async function verifyUser(userId) {
  const affected = await UserModel.verifyUser(userId);
  if (!affected) throw new Error("Không thể xác minh người dùng");
  return await UserModel.findById(userId);
}
// Hủy xác minh tài khoản (VERIFIED = 0)
async function unverifyUser(userId) {
  const affected = await UserModel.unverifyUser(userId);
  if (!affected) throw new Error("Không thể hủy xác minh người dùng");
  return await UserModel.findById(userId);
}
// Lấy danh sách user cho dropdown (Admin)
async function getUsersForDropdown() {
  const users = await UserModel.getForDropdown();
  return users.map((user) => ({
    value: user.USER_ID, // Mã (để form submit)
    label: `${user.USER_ID} -- ${user.FULLNAME || user.EMAIL}`, // Tên (để hiển thị)
  }));
}

async function changePassword(userId, oldPassword, newPassword) {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("Không tìm thấy người dùng");

  // So sánh mật khẩu cũ
  const valid = await bcrypt.compare(oldPassword, user.PASSWORD_HASH);
  if (!valid) throw new Error("Mật khẩu cũ không đúng");

  // Hash mật khẩu mới
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Cập nhật mật khẩu mới
  const affectedRows = await UserModel.resetPassword(userId, newPasswordHash);
  if (affectedRows === 0) throw new Error("Đổi mật khẩu thất bại");

  return { message: "Đổi mật khẩu thành công" };
}

module.exports = {
  register,
  verifyRegistration,
  login,
  loginAdmin,
  getAllUsers,
  getUserById,
  updateUserAvatar,
  updateUserLicense,
  updateUserProfile,
  deleteUser,
  verifyUser,
  unverifyUser,
  reActiveUser,
  getUsersForDropdown,
  changePassword,
};
