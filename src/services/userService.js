const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user");

async function register({ email, phone, password, fullname }) {
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) throw new Error("Email đã được đăng ký");

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await UserModel.create({
    email,
    phone,
    passwordHash,
    fullname,
  });

  return { userId, email };
}

async function login({ email, password }) {
  const user = await UserModel.findByEmail(email);
  if (!user) throw new Error("Sai tài khoản hoặc mật khẩu");

  const valid = await bcrypt.compare(password, user.PASSWORD_HASH);
  if (!valid) throw new Error("Sai tài khoản hoặc mật khẩu");

  const token = jwt.sign(
    { userId: user.USER_ID, role: user.ROLE },
    process.env.JWT_SECRET || "secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );

  return { token, user };
}

async function loginAdmin({ email, password }) {
  // 1. Tìm người dùng bằng email
  const user = await UserModel.findByEmail(email);

  // Kiểm tra nếu không tìm thấy người dùng
  if (!user) {
    throw new Error("Sai tài khoản hoặc mật khẩu");
  }

  // 2. So sánh mật khẩu
  const isPasswordValid = await bcrypt.compare(password, user.PASSWORD_HASH);

  // Kiểm tra nếu mật khẩu không hợp lệ
  if (!isPasswordValid) {
    throw new Error("Sai tài khoản hoặc mật khẩu");
  }

  // 3. KIỂM TRA VAI TRÒ ĐẶC BIỆT
  if (user.ROLE !== "ADMIN") {
    throw new Error("Từ chối truy cập. Người dùng không phải quản trị viên");
  }

  const token = jwt.sign(
    { userId: user.USER_ID, role: user.ROLE },
    process.env.JWT_SECRET || "khongdoanduocdau",
    { expiresIn: "1h" }
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

module.exports = {
  register,
  login,
  loginAdmin,
};
