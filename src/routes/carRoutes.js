// src/routes/carRoutes.js
const express = require("express");
const carController = require("../controllers/carController");
const { uploadCarImages } = require("../config/multer");

const router = express.Router();
// 1. [POST] /api/cars/ (Tạo Car mới - Thường là path root)
router.post("/", uploadCarImages, carController.handleCreateCar);

// 2. [GET] /api/cars/ (Lấy danh sách Car)
router.get("/", carController.handleGetAllCars);

// 3. [GET] /api/cars/:id (Lấy chi tiết Car theo ID)
// ĐÚNG: Cần có dấu / trước tham số động :id
router.get("/:id", carController.handleGetCarDetails);

// 4. [DELETE] /api/cars/:id (Xóa Car theo ID)
// ĐÚNG: Cần có dấu / trước tham số động :id
router.delete("/:id", carController.handleDeleteCar);

module.exports = router;
