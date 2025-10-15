const { connection } = require("../config/database");

// ✅ CREATE
async function createBanner({ title, image_url, description, status }) {
  const [result] = await connection.query(
    `INSERT INTO BANNERS (TITLE, IMAGE_URL, DESCRIPTION, STATUS)
     VALUES (?, ?, ?, ?)`,
    [title, image_url, description, status || "ACTIVE"]
  );
  return result;
}

// ✅ READ ALL
async function getAllBanners() {
  const [rows] = await connection.query(
    `SELECT * 
     FROM BANNERS
     ORDER BY CREATED_AT DESC`
  );
  return rows;
}

// ✅ READ BY ID
async function getBannerById(bannerId) {
  const [rows] = await connection.query(
    `SELECT * FROM BANNERS WHERE BANNER_ID = ?`,
    [bannerId]
  );
  return rows[0];
}

// ✅ UPDATE
async function updateBanner(bannerId, data) {
  const { title, image_url, description, status } = data;
  const [result] = await connection.query(
    `UPDATE BANNERS
     SET TITLE = ?, IMAGE_URL = ?, DESCRIPTION = ?, STATUS = ?
     WHERE BANNER_ID = ?`,
    [title, image_url, description, status, bannerId]
  );
  return result;
}

// ✅ DELETE
async function deleteBanner(bannerId) {
  const [result] = await connection.query(
    `DELETE FROM BANNERS WHERE BANNER_ID = ?`,
    [bannerId]
  );
  return result;
}

module.exports = {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};
