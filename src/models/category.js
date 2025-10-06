const { connection } = require("../config/database");

// CREATE
async function createCategory({ CODE, NAME, DESCRIPTION }) {
  const [result] = await connection.query(
    "INSERT INTO CATEGORY (CODE, NAME, DESCRIPTION) VALUES (?, ?, ?)",
    [CODE, NAME, DESCRIPTION]
  );
  return { CATEGORY_ID: result.insertId, CODE, NAME, DESCRIPTION };
}

// READ ALL
async function getAllCategories() {
  const [rows] = await connection.query("SELECT * FROM CATEGORY");
  return rows;
}

// READ BY ID
async function getCategoryById(id) {
  const [rows] = await connection.query(
    "SELECT * FROM CATEGORY WHERE CATEGORY_ID = ?",
    [id]
  );
  return rows[0];
}

// UPDATE
async function updateCategory(id, { CODE, NAME, DESCRIPTION }) {
  await connection.query(
    "UPDATE CATEGORY SET CODE = ?, NAME = ?, DESCRIPTION = ? WHERE CATEGORY_ID = ?",
    [CODE, NAME, DESCRIPTION, id]
  );
  return { CATEGORY_ID: id, CODE, NAME, DESCRIPTION };
}

// DELETE
async function deleteCategory(id) {
  await connection.query("DELETE FROM CATEGORY WHERE CATEGORY_ID = ?", [id]);
  return { message: "Category deleted successfully" };
}

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
