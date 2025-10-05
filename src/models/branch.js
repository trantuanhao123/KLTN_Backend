// models/branch.model.js
const { connection } = require("../config/database");

// CREATE
async function createBranch({
  name,
  address,
  phone,
  open_time,
  close_time,
  latitude,
  longitude,
}) {
  const [result] = await connection.query(
    `INSERT INTO BRANCH (NAME, ADDRESS, PHONE, OPEN_TIME, CLOSE_TIME, LATITUDE, LONGITUDE)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, address, phone, open_time, close_time, latitude, longitude]
  );
  return result;
}

// READ ALL
async function getAllBranches() {
  const [rows] = await connection.query(
    `SELECT * FROM BRANCH ORDER BY CREATED_AT DESC`
  );
  return rows;
}

// READ BY ID
async function getBranchById(branchId) {
  const [rows] = await connection.query(
    `SELECT * FROM BRANCH WHERE BRANCH_ID = ?`,
    [branchId]
  );
  return rows[0];
}

// UPDATE
async function updateBranch(branchId, data) {
  const { name, address, phone, open_time, close_time, latitude, longitude } =
    data;
  const [result] = await connection.query(
    `UPDATE BRANCH 
     SET NAME=?, ADDRESS=?, PHONE=?, OPEN_TIME=?, CLOSE_TIME=?, LATITUDE=?, LONGITUDE=? 
     WHERE BRANCH_ID=?`,
    [name, address, phone, open_time, close_time, latitude, longitude, branchId]
  );
  return result;
}

// DELETE
async function deleteBranch(branchId) {
  const [result] = await connection.query(
    `DELETE FROM BRANCH WHERE BRANCH_ID = ?`,
    [branchId]
  );
  return result;
}

module.exports = {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};
