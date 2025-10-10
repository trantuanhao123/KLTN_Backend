const carService = require("../services/carService");
const fs = require("fs/promises");
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
    // Log lỗi
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
    // Log lỗi
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
    // Log lỗi
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
    // Log lỗi
    console.error(error);
    return res.status(404).json({ error: error.message });
  }
};

const handleUpdateCar = async (req, res) => {
  const carId = req.params.id;
  console.log(req.body);
  try {
    // Kiểm tra cơ bản
    if (!req.body.licensePlate || !req.body.categoryId) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const result = await carService.updateExistingCar(carId, req.body);
    return res.status(200).json(result);
  } catch (err) {
    console.error(`❌ Lỗi khi cập nhật xe ID ${carId}:`, err);
    const status =
      err.message.includes("not found") ||
      err.message.includes("Invalid Car ID")
        ? 404
        : 500;

    return res.status(status).json({ error: err.message });
  }
};
module.exports = {
  handleCreateCar,
  handleGetCarDetails,
  handleGetAllCars,
  handleDeleteCar,
  handleUpdateCar,
};
