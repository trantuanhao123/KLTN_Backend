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
  const files = req.files || []; // Danh sách file ảnh mới (nếu có)
  const uploadedFilePaths = []; // Mảng lưu trữ đường dẫn file mới đã upload thành công bởi Multer

  try {
    // Lưu lại đường dẫn file mới để xóa nếu có lỗi database
    if (files.length > 0) {
      files.forEach((file) => uploadedFilePaths.push(file.path));
    }

    // Kiểm tra cơ bản
    if (!req.body.licensePlate || !req.body.categoryId) {
      return res
        .status(400)
        .json({ error: "Missing required fields for update." });
    }

    // Gọi Service để thực hiện cập nhật
    const result = await carService.updateExistingCar(carId, req.body, files);

    return res.status(200).json(result);
  } catch (error) {
    // ⚠️ Xử lý Rollback File: Xóa các file mới đã upload nếu database bị lỗi
    if (uploadedFilePaths.length > 0) {
      for (const filePath of uploadedFilePaths) {
        // Ta sử dụng fs.unlink không dùng await để việc xóa file không làm chặn luồng lỗi
        fs.unlink(filePath).catch((err) => {
          // Ghi lại lỗi khi xóa file tạm đã upload, nhưng vẫn trả về lỗi database ban đầu
          console.error(`Lỗi khi xóa file tạm đã upload: ${filePath}`, err);
        });
      }
    }

    // Log lỗi khi cập nhật xe
    console.error(`Lỗi khi cập nhật xe ID ${carId}:`, error);

    // Xác định Status Code phù hợp (404 nếu không tìm thấy, 500 nếu lỗi server/DB khác)
    const status =
      error.message.includes("not found") ||
      error.message.includes("Invalid Car ID")
        ? 404
        : 500;

    return res.status(status).json({
      error: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  handleCreateCar,
  handleGetCarDetails,
  handleGetAllCars,
  handleDeleteCar,
  handleUpdateCar,
};
