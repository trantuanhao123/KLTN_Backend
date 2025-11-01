const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController");
const { uploadBannerImage } = require("../config/multer");
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");
// CREATE banner
router.post(
  "/",
  authMiddleware,
  requireAdmin,
  uploadBannerImage,
  bannerController.createBanner
);

// GET all banners
router.get("/", authMiddleware, bannerController.getAllBanners);

// GET one banner
router.get(
  "/:id",
  authMiddleware,
  requireAdmin,
  bannerController.getBannerById
);

// UPDATE banner (cho phép upload hình mới)
router.patch(
  "/:id",
  authMiddleware,
  requireAdmin,
  uploadBannerImage,
  bannerController.updateBanner
);

// DELETE banner (xóa luôn hình cũ)
router.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  bannerController.deleteBanner
);

// TOGGLE status ACTIVE <-> INACTIVE
router.patch(
  "/updateStatus/:id",
  authMiddleware,
  requireAdmin,
  bannerController.updateStatus
);

module.exports = router;
