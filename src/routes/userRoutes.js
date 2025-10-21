const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");
const {
  uploadCarImages,
  uploadAvatar,
  uploadLicense,
} = require("../config/multer");

router.post("/register", userController.register);
router.post("/verify-register", userController.verifyRegistration);
router.post("/login", userController.login);
router.post("/loginAdmin", userController.loginAdmin);
router.get("/profile", authMiddleware, userController.profile);

//Update Profile
router.put("/editProfile/:id", userController.updateProfile);

// Route cập nhật avatar (dữ liệu multipart/form-data, 1 file)
router.post("/editAvatar/:id", uploadAvatar, userController.uploadAvatar);

// Route cập nhật bằng lái xe (dữ liệu multipart/form-data, 2 files)
router.post("/editLicense/:id", uploadLicense, userController.uploadLicense);

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
  "/unban/:id",
  authMiddleware,
  requireAdmin,
  userController.reActiveUser
);
module.exports = router;
