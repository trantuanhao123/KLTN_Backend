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
    process.env.JWT_SECRET || "khongdoanduocdau",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );

  return { token, user };
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
// 🆕 Lấy danh sách người dùng
async function getAllUsers() {
  const users = await UserModel.getAll();
  return users;
}

// 🆕 Lấy thông tin người dùng theo ID
async function getUserById(userId) {
  const user = await UserModel.findById(userId);
  if (!user || user.IS_DELETED) throw new Error("Người dùng không tồn tại");
  return user;
}

// 🆕 Cập nhật thông tin người dùng
async function updateUser(userId, updateData) {
  const affected = await UserModel.update(userId, updateData);
  if (!affected) throw new Error("Không thể cập nhật người dùng");
  return await UserModel.findById(userId);
}

// 🆕 Xóa người dùng (soft delete)
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
// 🆕 Xác minh tài khoản (VERIFIED = 1)
async function verifyUser(userId) {
  const affected = await UserModel.verifyUser(userId);
  if (!affected) throw new Error("Không thể xác minh người dùng");
  return await UserModel.findById(userId);
}

module.exports = {
  register,
  login,
  loginAdmin,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  verifyUser,
  reActiveUser,
};
