const { connection } = require("../config/database");
// Lấy tất cả service
async function getAllServices() {
  const [rows] = await connection.query("SELECT * FROM SERVICE");
  return rows;
}

// Lấy service theo ID
async function getServiceById(serviceId) {
  const [rows] = await connection.query(
    "SELECT * FROM SERVICE WHERE SERVICE_ID = ?",
    [serviceId]
  );
  return rows[0];
}

// Tạo service mới
async function createService(name, description) {
  const [result] = await connection.query(
    "INSERT INTO SERVICE (NAME, DESCRIPTION) VALUES (?, ?)",
    [name, description]
  );
  return result;
}

// Cập nhật service
async function updateService(serviceId, name, description) {
  const [result] = await connection.query(
    "UPDATE SERVICE SET NAME = ?, DESCRIPTION = ? WHERE SERVICE_ID = ?",
    [name, description, serviceId]
  );
  return result;
}

// Xóa service
async function deleteService(serviceId) {
  const [result] = await connection.query(
    "DELETE FROM SERVICE WHERE SERVICE_ID = ?",
    [serviceId]
  );
  return result;
}

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
