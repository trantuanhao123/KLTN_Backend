const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const verifyResetToken = require("../middlewares/verifyReset");
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/loginAdmin", userController.loginAdmin);
router.get("/profile", authMiddleware, userController.profile);

//Reset Psssword
router.post("/request-password-reset", userController.requestPasswordReset);
router.post("/reset-password", verifyResetToken, userController.resetPassword);
module.exports = router;
