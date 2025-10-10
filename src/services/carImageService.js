const path = require("path");
const fs = require("fs/promises");
const carImageModel = require("../models/carImage");

const IMAGE_DIR = path.join(__dirname, "..", "public", "images");

const getCarImages = async (carId) => {
  return await carImageModel.getImagesByCarId(carId);
};

const addCarImage = async (carId, files) => {
  if (!files || files.length === 0) throw new Error("No image file uploaded.");

  // B1: Kiểm tra xem xe đã có ảnh chính hay chưa TỪ ĐẦU
  const mainImageExists = await carImageModel.checkMainImageExists(carId);

  const addedImages = [];

  for (const [index, file] of files.entries()) {
    // B2: Xác định isMain cho ảnh mới dựa vào kết quả kiểm tra
    // isMain sẽ là 1 (true) KHI VÀ CHỈ KHI:
    // - Xe chưa có ảnh chính (!mainImageExists)
    // - VÀ đây là ảnh đầu tiên trong danh sách upload (index === 0)
    const isMain = !mainImageExists && index === 0 ? 1 : 0;

    const imageId = await carImageModel.addCarImage(
      carId,
      file.filename,
      isMain
    );
    addedImages.push({ imageId, fileName: file.filename, isMain });
  }

  return addedImages;
};

const deleteCarImage = async (imageId) => {
  // B1: Lấy thông tin ảnh sắp xóa (để biết nó có phải isMain và thuộc carId nào)
  const imageToDelete = await carImageModel.getImageById(imageId);

  if (!imageToDelete) {
    throw new Error("Image not found.");
  }

  // B2: Xóa bản ghi trong DB (bước này trả về tên file, nhưng chúng ta đã có từ bước 1)
  await carImageModel.deleteCarImage(imageId);

  // B3: Xóa file vật lý trong thư mục /public/images
  const fullPath = path.join(IMAGE_DIR, imageToDelete.URL);
  try {
    await fs.unlink(fullPath);
  } catch (err) {
    console.warn(`⚠️ Không tìm thấy file vật lý để xóa: ${fullPath}`);
  }

  // B4: Nếu ảnh vừa xóa LÀ ảnh chính -> tìm và đặt ảnh khác làm ảnh chính
  if (imageToDelete.IS_MAIN === 1) {
    await carImageModel.promoteFirstImageToMain(imageToDelete.CAR_ID);
  }

  return { message: "Image deleted successfully", file: imageToDelete.URL };
};

module.exports = {
  getCarImages,
  addCarImage,
  deleteCarImage,
};
