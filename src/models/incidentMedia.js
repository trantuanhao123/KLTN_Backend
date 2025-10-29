// models/incidentMedia.model.js
const { connection } = require("../config/database");

/**
 * 🟢 Tạo media hàng loạt (dùng trong transaction)
 */
const createBulk = async (mediaData, conn = connection) => {
  // mediaData là mảng 2 chiều: [[INCIDENT_ID, URL, MEDIA_TYPE], ...]
  const sql =
    "INSERT INTO INCIDENT_MEDIA (INCIDENT_ID, URL, MEDIA_TYPE) VALUES ?";
  const [result] = await conn.query(sql, [mediaData]);
  return result.affectedRows;
};

/**
 * 🔍 Lấy media theo incidentId
 */
const findByIncidentId = async (incidentId, conn = connection) => {
  const sql = "SELECT * FROM INCIDENT_MEDIA WHERE INCIDENT_ID = ?";
  const [rows] = await conn.query(sql, [incidentId]);
  return rows;
};

/**
 * ❌ Xóa media (hàm này không cần thiết nếu dùng ON DELETE CASCADE,
 * nhưng hữu ích nếu muốn xóa file thủ công trước khi xóa incident)
 */
const removeByIncidentId = async (incidentId, conn = connection) => {
  const sql = "DELETE FROM INCIDENT_MEDIA WHERE INCIDENT_ID = ?";
  const [result] = await conn.execute(sql, [incidentId]);
  return result.affectedRows;
};

module.exports = {
  createBulk,
  findByIncidentId,
  removeByIncidentId,
};
