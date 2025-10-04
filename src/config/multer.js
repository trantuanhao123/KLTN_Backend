// src/config/multer.js
const multer = require("multer");
const path = require("path");

// Hàm tạo chuỗi ngẫu nhiên ngắn
const generateRandomString = (length = 4) => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
};

// Cấu hình lưu trữ
const carImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Đường dẫn đến thư mục public/images
    cb(null, path.join(__dirname, "..", "public", "images"));
  },
  filename: (req, file, cb) => {
    // Tạo tên file duy nhất: TIMESTAMP-NGẪU_NHIÊN.mởrộng
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${Date.now()}-${generateRandomString()}${fileExtension}`;
    cb(null, uniqueFilename);
  },
});

// Hàm kiểm tra loại file
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    // Trả về lỗi nếu không phải là hình ảnh
    cb(new Error("File không phải là hình ảnh!"), false);
  }
};

// Middleware Multer cho nhiều hình ảnh
const uploadCarImages = multer({
  storage: carImageStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Giới hạn 5MB
}).array("carImages", 10); // 'carImages' là tên trường (field name) trong form

module.exports = {
  uploadCarImages,
};
