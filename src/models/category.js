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
  const [rows] = await connection.query(`
    SELECT 
      c.CATEGORY_ID,
      c.CODE,
      c.NAME,
      c.DESCRIPTION,
      COUNT(car.CAR_ID) AS total_cars
    FROM CATEGORY c
    LEFT JOIN CAR car ON c.CATEGORY_ID = car.CATEGORY_ID
    GROUP BY c.CATEGORY_ID, c.CODE, c.NAME, c.DESCRIPTION
    ORDER BY c.CATEGORY_ID ASC
  `);
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
