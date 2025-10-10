const express = require("express");
const router = express.Router();
const { uploadCarImages } = require("../config/multer");
const carImageController = require("../controllers/carImageController");

// GET danh sách ảnh của xe
router.get("/:carId", carImageController.handleGetImagesByCarId);

// POST thêm ảnh mới cho xe
router.post("/:carId", uploadCarImages, carImageController.handleAddCarImages);

// DELETE xóa 1 ảnh (DB + file vật lý)
router.delete("/:imageId", carImageController.handleDeleteCarImage);

module.exports = router;
