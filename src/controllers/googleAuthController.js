const { OAuth2Client } = require("google-auth-library");
const authService = require("./googleAuthController");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

async function mobileGoogleSignIn(req, res) {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "Thiếu ID Token." });
  }

  try {
    // --- 1. XÁC MINH ID TOKEN VỚI GOOGLE ---
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Chuẩn bị dữ liệu để truyền vào Service
    const userData = {
      googleId: payload["sub"],
      email: payload["email"],
      fullName: payload["name"],
      avatarUrl: payload["picture"],
    };

    // --- 2. GỌI SERVICE ĐỂ XỬ LÝ DB VÀ TẠO JWT ---
    const { token, userId } = await authService.handleGoogleUpsert(userData);

    // --- 3. TRẢ VỀ RESPONSE THÀNH CÔNG ---
    return res.status(200).json({
      message: "Đăng nhập Google thành công",
      token: token,
      user_id: userId,
    });
  } catch (error) {
    // Xử lý lỗi xác minh Token Google
    if (
      error.code === "ERR_INVALID_AUDIENCE" ||
      error.message.includes("Token used too early")
    ) {
      console.error("Lỗi Xác minh Token Google:", error.message);
      return res
        .status(401)
        .json({ message: "Token Google không hợp lệ hoặc đã hết hạn." });
    }

    // Xử lý lỗi DB hoặc lỗi khác từ Service
    console.error("Lỗi server trong quá trình Google Sign In:", error);
    return res.status(500).json({ message: "Lỗi server nội bộ." });
  }
}

module.exports = {
  mobileGoogleSignIn,
};
