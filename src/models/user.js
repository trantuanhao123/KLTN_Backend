const connection = require("../config/database");

async function create(userData) {
  const sql = `
    INSERT INTO USERS 
    (EMAIL, PHONE, PASSWORD_HASH, ROLE, FULLNAME, PROVIDER, PROVIDER_ID) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const [result] = await connection.query(sql, [
    userData.email,
    userData.phone,
    userData.passwordHash,
    userData.role || "CUSTOMER",
    userData.fullname || null,
    userData.provider || "local",
    userData.providerId || null,
  ]);
  return result.insertId;
}

async function findByEmail(email) {
  const [rows] = await connection.query(`SELECT * FROM USERS WHERE EMAIL = ?`, [
    email,
  ]);
  return rows[0];
}

async function findById(userId) {
  const [rows] = await connection.query(
    `SELECT * FROM USERS WHERE USER_ID = ?`,
    [userId]
  );
  return rows[0];
}

module.exports = {
  create,
  findByEmail,
  findById,
};
