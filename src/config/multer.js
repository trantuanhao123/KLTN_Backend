const multer = require("multer");
const path = require("path");

// Hàm tạo chuỗi ngẫu nhiên ngắn
const generateRandomString = (length = 4) => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
};

// Cấu hình lưu trữ chung
const commonStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "public", "images"));
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${Date.now()}-${generateRandomString()}${fileExtension}`;
    cb(null, uniqueFilename);
  },
});

// Chỉ cho phép file ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("File không phải là hình ảnh!"), false);
};

// Hàm tạo upload middleware linh hoạt
function createUploadMiddleware(fieldName, maxCount = 1) {
  return multer({
    storage: commonStorage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 }, // Giới hạn 5MB
  }).array(fieldName, maxCount);
}

// ✅ Upload avatar (1 hình)
const uploadAvatar = multer({
  storage: commonStorage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
}).single("avatar");

// ✅ Upload hình xe (nhiều hình)
const uploadCarImages = createUploadMiddleware("carImages", 10);

// ✅ Upload bằng lái (2 hình trong cùng form)
const uploadLicense = multer({
  storage: commonStorage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
}).fields([
  { name: "license_front", maxCount: 1 },
  { name: "license_back", maxCount: 1 },
]);

const uploadBannerImage = multer({
  storage: commonStorage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Giới hạn 5MB
}).single("banner_url");

module.exports = {
  uploadAvatar,
  uploadCarImages,
  uploadLicense,
  uploadBannerImage,
};
