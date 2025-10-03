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
async function findForResetPassword(email, phone, fullname) {
  const sql = `
    SELECT * 
    FROM USERS 
    WHERE EMAIL = ? AND PHONE = ? AND FULLNAME = ?`;
  const [rows] = await connection.query(sql, [email, phone, fullname]);
  return rows[0];
}
async function resetPassword(userId, newPasswordHash) {
  const sql = `
    UPDATE USERS
    SET PASSWORD_HASH = ?,
        UPDATED_AT = NOW()
    WHERE USER_ID = ?`;
  const [result] = await connection.query(sql, [newPasswordHash, userId]);
  return result.affectedRows;
}
module.exports = {
  create,
  findByEmail,
  findById,
  findForResetPassword,
  resetPassword,
};
