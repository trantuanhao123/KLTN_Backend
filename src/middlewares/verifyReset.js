const jwt = require("jsonwebtoken");
const UserModel = require("../models/user");

// async function verifyResetToken(req, res, next) {
//   console.log("req.body in verifyResetToken:", req.body);
//   const { resetToken } = req.body;

//   if (!resetToken) return res.status(400).json({ error: "Thiếu token" });

//   try {
//     const payload = jwt.verify(
//       resetToken,
//       process.env.JWT_SECRET || "khongdoanduocdau"
//     );

//     const user = await UserModel.findById(payload.userId);
//     if (!user)
//       return res.status(404).json({ error: "Người dùng không tồn tại" });

//     // Gắn user vào req để dùng ở controller/service
//     req.user = user;
//     next();
//   } catch (err) {
//     res.status(403).json({ error: "Token không hợp lệ hoặc đã hết hạn" });
//   }
// }
async function verifyResetToken(req, res, next) {
  // 1. Log đầu vào
  console.log("--- Bắt đầu verifyResetToken middleware ---");
  console.log("req.body:", req.body);
  const { resetToken } = req.body;
  console.log("resetToken nhận được:", resetToken);

  // 2. Kiểm tra token có thiếu không
  if (!resetToken) {
    console.log("LỖI: Thiếu token trong req.body");
    return res.status(400).json({ error: "Thiếu token" });
  }

  try {
    const secret = process.env.JWT_SECRET || "khongdoanduocdau";
    console.log("JWT Secret (sử dụng để verify):", secret);

    // 3. Log trước khi verify
    console.log("Bắt đầu xác minh (verify) token...");
    const payload = jwt.verify(resetToken, secret);
    // 4. Log payload sau khi verify thành công
    console.log("Token xác minh thành công. Payload:", payload);

    // 5. Tìm người dùng
    console.log("Tìm kiếm người dùng với userId:", payload.userId);
    const user = await UserModel.findById(payload.userId);

    // 6. Kiểm tra người dùng tồn tại
    if (!user) {
      console.log("LỖI: Người dùng với ID", payload.userId, "không tồn tại");
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }
    // Gắn user vào req để dùng ở controller/service
    req.user = user;
    console.log(
      "Người dùng đã được gắn vào req.user. Tiếp tục (next()).",
      user
    );
    console.log("--- Kết thúc verifyResetToken thành công ---");
    next();
  } catch (err) {
    // 8. Log lỗi nếu verify hoặc tìm người dùng thất bại
    console.log("LỖI XÁC MINH/TÌM NGƯỜI DÙNG:", err.message);
    console.log("--- Kết thúc verifyResetToken thất bại ---");
    res.status(403).json({ error: "Token không hợp lệ hoặc đã hết hạn" });
  }
}
module.exports = verifyResetToken;
