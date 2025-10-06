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
    cb(null, path.join(__dirname, "..", "public", "images"));
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${Date.now()}-${generateRandomString()}${fileExtension}`;
    cb(null, uniqueFilename);
  },
});

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("File không phải là hình ảnh!"), false);
};

// Middleware Multer cho nhiều hình ảnh
const uploadCarImages = multer({
  storage: carImageStorage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Giới hạn 5MB
}).array("carImages", 10);

module.exports = { uploadCarImages };
