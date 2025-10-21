// File: models/otpModel.js
const { connection } = require("../config/database");

async function createToken(userId, otp, expiresAt) {
  const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace("T", " ");
  const query = `
        INSERT INTO REGISTRATION_OTPS 
        (USER_ID, OTP, EXPIRES_AT, USED) 
        VALUES (?, ?, ?, FALSE)
    `;
  await connection.query(query, [userId, otp, expiresAtStr]);
}

async function findValidToken(userId, otp) {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const query = `
        SELECT ID, USER_ID
        FROM REGISTRATION_OTPS
        WHERE USER_ID = ? 
        AND OTP = ? 
        AND USED = FALSE 
        AND EXPIRES_AT > ?
        ORDER BY CREATED_AT DESC 
        LIMIT 1
    `;
  const [rows] = await connection.query(query, [userId, otp, now]);
  return rows[0] || null;
}

async function markTokenAsUsed(tokenId) {
  await connection.query(
    "UPDATE REGISTRATION_OTPS SET USED = TRUE WHERE ID = ?",
    [tokenId]
  );
}

/**
 * Xóa hết OTP cũ của 1 user (dùng khi user đăng ký lại)
 */
async function clearAllForUser(userId) {
  const sql = `
    DELETE FROM REGISTRATION_OTPS 
    WHERE USER_ID = ?
  `;
  const [result] = await connection.query(sql, [userId]);
  return result.affectedRows;
}

module.exports = {
  createToken,
  findValidToken,
  markTokenAsUsed,
  clearAllForUser,
};
