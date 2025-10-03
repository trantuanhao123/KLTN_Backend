const UserService = require("../services/userService");

async function register(req, res) {
  try {
    const { email, phone, password, fullname } = req.body;
    const result = await UserService.register({
      email,
      phone,
      password,
      fullname,
    });
    res.status(201).json({ message: "User registered successfully", result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await UserService.login({ email, password });
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}
async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;
    const adminInfo = await UserService.loginAdmin({
      email,
      password,
    });
    res.status(200).json({
      message: "Admin login successful",
      ...adminInfo,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}
async function profile(req, res) {
  try {
    const user = req.user;
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
// Bước 1: Xác thực người dùng → trả resetToken
async function requestPasswordReset(req, res) {
  try {
    const { email, phone, fullname } = req.body;
    if (!email || !phone || !fullname) {
      return res.status(400).json({ error: "Vui lòng nhập đủ 3 trường" });
    }

    const result = await UserService.generateResetToken({
      email,
      phone,
      fullname,
    });
    res.status(200).json({ message: "Thông tin hợp lệ", ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
// Bước 2: Đổi mật khẩu bằng resetToken
async function resetPassword(req, res) {
  try {
    // 1. Controller lấy dữ liệu từ req, user đã được middleware gắn vào
    const user = req.user;
    const { newPassword } = req.body;

    // 2. Controller gọi Service (chỉ truyền dữ liệu sạch)
    const result = await UserService.resetPasswordWithToken(user, newPassword);

    // 3. Controller gửi response thành công
    res.status(200).json(result);
  } catch (error) {
    // 4. Controller bắt lỗi từ Service và gửi response lỗi
    console.error("Controller Error:", error.message);

    // Cần tùy chỉnh status code dựa trên loại lỗi
    let statusCode = 500; // Mặc định là lỗi Server
    if (
      error.message.includes("Thiếu thông tin") ||
      error.message.includes("không hợp lệ")
    ) {
      statusCode = 400;
    }

    res.status(statusCode).json({ error: error.message });
  }
}

module.exports = {
  register,
  login,
  loginAdmin,
  profile,
  requestPasswordReset,
  resetPassword,
};
