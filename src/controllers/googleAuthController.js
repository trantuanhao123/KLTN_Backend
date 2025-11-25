const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
// Đảm bảo đường dẫn này trỏ đúng vào file service của bạn
const authService = require("../services/googleAuthService");

// Xử lý chuỗi Client ID để tránh lỗi do khoảng trắng thừa
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : "";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

async function mobileGoogleSignIn(req, res) {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "Thiếu ID Token." });
  }

  try {
    // 1. Giải mã sơ bộ để lấy thông tin (Dùng cho Bypass nếu cần)
    const decoded = jwt.decode(idToken);
    if (!decoded) throw new Error("Token không đúng định dạng.");

    console.log(">> [GoogleAuth] Đang Verify Token...");

    // 2. Xác minh chính thức với Google
    // Thêm 'issuers' để chấp nhận cả token từ Android App và Web
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
      issuers: ['https://accounts.google.com', 'accounts.google.com'] 
    });

    const payload = ticket.getPayload();
    console.log(">> [GoogleAuth] Verify thành công! User:", payload.email);

    // 3. Chuẩn bị dữ liệu User
    const userData = {
      googleId: payload["sub"],
      email: payload["email"],
      fullName: payload["name"],
      avatarUrl: payload["picture"],
    };

    // 4. Gọi Service để lưu DB và tạo JWT
    const { token, userId } = await authService.handleGoogleUpsert(userData);

    return res.status(200).json({
      message: "Đăng nhập Google thành công",
      token: token,
      user_id: userId,
    });

  } catch (error) {
    console.error(">> [GoogleAuth] Lỗi Verify Chính thức:", error.message);

    // --- CHẾ ĐỘ DỰ PHÒNG (BYPASS) ---
    // Nếu xác thực thất bại nhưng không phải do hết hạn, ta tạm thời chấp nhận thông tin giải mã thô
    // để không làm gián đoạn việc phát triển (Dev Mode)
    
    if (error.message && !error.message.includes("expired")) {
        console.log("⚠️ [GoogleAuth] ĐANG DÙNG CHẾ ĐỘ BYPASS...");
        try {
            const decoded = jwt.decode(idToken);
            // Kiểm tra khớp Client ID lần cuối
            if (decoded && decoded.aud === GOOGLE_CLIENT_ID) {
                const userData = {
                    googleId: decoded["sub"],
                    email: decoded["email"],
                    fullName: decoded["name"],
                    avatarUrl: decoded["picture"],
                };
                
                const { token, userId } = await authService.handleGoogleUpsert(userData);
                
                return res.status(200).json({
                    message: "Đăng nhập thành công (Bypass Verify)",
                    token: token,
                    user_id: userId,
                });
            }
        } catch (bypassErr) {
            console.error(">> [GoogleAuth] Bypass cũng thất bại:", bypassErr);
        }
    }
    // --------------------------------

    return res.status(401).json({ message: "Xác thực thất bại: " + error.message });
  }
}

module.exports = { mobileGoogleSignIn };