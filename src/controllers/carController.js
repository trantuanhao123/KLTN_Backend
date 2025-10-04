// src/controllers/carController.js
const carService = require("../services/carService");

// Sử dụng Joi để Validate dữ liệu (Tùy chọn, nên làm trong production)
// const Joi = require('joi');

// Thao tác CREATE
const handleCreateCar = async (req, res) => {
  try {
    // req.body chứa các trường dữ liệu text (LICENSE_PLATE, CATEGORY_ID, ...)
    const carData = req.body;
    // req.files chứa thông tin các file đã được multer upload
    const files = req.files || [];

    // Kiểm tra cơ bản
    if (!carData.licensePlate || !carData.categoryId) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const result = await carService.createNewCar(carData, files);
    return res.status(201).json(result);
  } catch (error) {
    console.error(error);
    // Xử lý lỗi từ Multer (ví dụ: kích thước file quá lớn)
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File size too large. Max 5MB." });
    }
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

// Thao tác READ (Chi tiết)
const handleGetCarDetails = async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    if (isNaN(carId)) {
      return res.status(400).json({ error: "Invalid Car ID." });
    }

    const car = await carService.getCarDetails(carId);
    return res.status(200).json(car);
  } catch (error) {
    console.error(error);
    return res.status(404).json({ error: error.message }); // Lỗi 404 nếu không tìm thấy
  }
};

// Thao tác READ (Danh sách)
const handleGetAllCars = async (req, res) => {
  try {
    const cars = await carService.getCarList();
    return res.status(200).json(cars);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Thao tác DELETE
const handleDeleteCar = async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    if (isNaN(carId)) {
      return res.status(400).json({ error: "Invalid Car ID." });
    }

    const result = await carService.deleteExistingCar(carId);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(404).json({ error: error.message });
  }
};

// ... Thêm handleUpdateCar nếu cần

module.exports = {
  handleCreateCar,
  handleGetCarDetails,
  handleGetAllCars,
  handleDeleteCar,
};
