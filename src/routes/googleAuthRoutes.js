const express = require("express");
const router = express.Router();
const authController = require("../controllers/googleAuthController");

router.post("/login", authController.mobileGoogleSignIn);

module.exports = router;
