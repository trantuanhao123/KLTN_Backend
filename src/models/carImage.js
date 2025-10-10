const { connection } = require("../config/database");

const getImagesByCarId = async (carId) => {
  const [rows] = await connection.execute(
    `SELECT IMAGE_ID, CAR_ID, URL, IS_MAIN 
     FROM CAR_IMAGE 
     WHERE CAR_ID = ? 
     ORDER BY IS_MAIN DESC, IMAGE_ID ASC`,
    [carId]
  );
  return rows;
};

const addCarImage = async (carId, fileName, isMain = 0) => {
  const [result] = await connection.execute(
    `INSERT INTO CAR_IMAGE (CAR_ID, URL, IS_MAIN) VALUES (?, ?, ?)`,
    [carId, fileName, isMain]
  );
  return result.insertId;
};

const deleteCarImage = async (imageId) => {
  const [rows] = await connection.execute(
    `SELECT URL FROM CAR_IMAGE WHERE IMAGE_ID = ?`,
    [imageId]
  );

  if (rows.length === 0) return null; // không tìm thấy ảnh

  const imagePath = rows[0].URL;

  // Xóa bản ghi trong DB
  await connection.execute(`DELETE FROM CAR_IMAGE WHERE IMAGE_ID = ?`, [
    imageId,
  ]);

  return imagePath;
};
const checkMainImageExists = async (carId) => {
  const [rows] = await connection.execute(
    // Dùng SELECT 1 và LIMIT 1 để tối ưu hiệu năng, chỉ cần biết có tồn tại hay không
    `SELECT 1 FROM CAR_IMAGE WHERE CAR_ID = ? AND IS_MAIN = 1 LIMIT 1`,
    [carId]
  );
  // Nếu có kết quả (rows.length > 0) thì trả về true, ngược lại false
  return rows.length > 0;
};
// Lấy đầy đủ thông tin của 1 ảnh bằng ID
const getImageById = async (imageId) => {
  const [rows] = await connection.execute(
    `SELECT IMAGE_ID, CAR_ID, URL, IS_MAIN FROM CAR_IMAGE WHERE IMAGE_ID = ?`,
    [imageId]
  );
  return rows[0]; // Trả về object ảnh hoặc undefined
};

// --- HÀM MỚI ---
// Tìm và cập nhật ảnh có ID nhỏ nhất của xe thành ảnh chính
const promoteFirstImageToMain = async (carId) => {
  const [result] = await connection.execute(
    `UPDATE CAR_IMAGE SET IS_MAIN = 1 
     WHERE CAR_ID = ? 
     ORDER BY IMAGE_ID ASC 
     LIMIT 1`,
    [carId]
  );
  return result.affectedRows > 0; // Trả về true nếu có ảnh được cập nhật
};
module.exports = {
  getImagesByCarId,
  addCarImage,
  deleteCarImage,
  checkMainImageExists,
  getImageById,
  promoteFirstImageToMain,
};
