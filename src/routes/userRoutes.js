const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/loginAdmin", userController.loginAdmin);
router.get("/profile", authMiddleware, userController.profile);

// Admin-only CRUD
router.get("/", authMiddleware, requireAdmin, userController.getAllUsers);
router.get("/:id", authMiddleware, requireAdmin, userController.getUserById);
router.patch("/:id", authMiddleware, requireAdmin, userController.updateUser);
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
