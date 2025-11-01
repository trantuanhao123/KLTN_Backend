const express = require("express");
const router = express.Router();
const { uploadCarImages } = require("../config/multer");
const carImageController = require("../controllers/carImageController");
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");
// GET danh sách ảnh của xe
router.get(
  "/:carId",
  authMiddleware,
  carImageController.handleGetImagesByCarId
);

// POST thêm ảnh mới cho xe
router.post(
  "/:carId",
  authMiddleware,
  requireAdmin,
  uploadCarImages,
  carImageController.handleAddCarImages
);

// DELETE xóa 1 ảnh (DB + file vật lý)
router.delete(
  "/:imageId",
  authMiddleware,
  requireAdmin,
  carImageController.handleDeleteCarImage
);

module.exports = router;
