function requireAdmin(req, res, next) {
  // req.user đã có từ authMiddleware
  if (!req.user) {
    return res.status(401).json({ error: "Chưa xác thực - cần đăng nhập" });
  }

  if (req.user.ROLE !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "Truy cập bị từ chối - chỉ dành cho Quản trị viên" });
  }

  next();
}
module.exports = requireAdmin;
