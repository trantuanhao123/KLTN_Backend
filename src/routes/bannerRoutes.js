const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController");
const { uploadBannerImage } = require("../config/multer");

// CREATE banner
router.post("/", uploadBannerImage, bannerController.createBanner);

// GET all banners
router.get("/", bannerController.getAllBanners);

// GET one banner
router.get("/:id", bannerController.getBannerById);

// UPDATE banner (cho phép upload hình mới)
router.patch("/:id", uploadBannerImage, bannerController.updateBanner);

// DELETE banner (xóa luôn hình cũ)
router.delete("/:id", bannerController.deleteBanner);

// TOGGLE status ACTIVE <-> INACTIVE
router.patch("/updateStatus/:id", bannerController.updateStatus);

module.exports = router;
