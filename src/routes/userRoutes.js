const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");
const { uploadAvatar, uploadLicense } = require("../config/multer");

router.post("/register", userController.register);
router.post("/verify-register", userController.verifyRegistration);
router.post("/login", userController.login);
router.post("/loginAdmin", userController.loginAdmin);
router.get("/profile", authMiddleware, userController.profile);
router.post("/change-password", authMiddleware, userController.changePassword);
router.post("/resend-register-otp", userController.resendRegisterOtp);

//Update Profile
router.put("/editProfile/:id", authMiddleware, userController.updateProfile);

// Route cập nhật avatar (dữ liệu multipart/form-data, 1 file)
router.post(
  "/editAvatar/:id",
  authMiddleware,
  uploadAvatar,
  userController.uploadAvatar
);

// Route cập nhật bằng lái xe (dữ liệu multipart/form-data, 2 files)
router.post(
  "/editLicense/:id",
  authMiddleware,
  uploadLicense,
  userController.uploadLicense
);

// Admin-only CRUD
router.get("/", authMiddleware, requireAdmin, userController.getAllUsers);
router.get("/:id", authMiddleware, requireAdmin, userController.getUserById);
router.delete("/:id", authMiddleware, requireAdmin, userController.deleteUser);
router.patch(
  "/:id/verify",
  authMiddleware,
  requireAdmin,
  userController.verifyUser
);
router.patch(
  "/:id/unverify",
  authMiddleware,
  requireAdmin,
  userController.unverifyUser
);
router.patch(
  "/unban/:id",
  authMiddleware,
  requireAdmin,
  userController.reActiveUser
);
module.exports = router;
