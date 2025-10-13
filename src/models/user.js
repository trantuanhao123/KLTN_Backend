const { connection } = require("../config/database");

// 🟢 Tạo người dùng mới
async function create(userData) {
  const sql = `
    INSERT INTO USERS 
    (EMAIL, PHONE, PASSWORD_HASH, ROLE, FULLNAME, PROVIDER, PROVIDER_ID) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
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

// 🔍 Tìm theo email
async function findByEmail(email) {
  const [rows] = await connection.query(
    `SELECT * FROM USERS WHERE EMAIL = ? AND IS_DELETED = 0`,
    [email]
  );
  return rows[0];
}

// 🔍 Tìm theo ID
async function findById(userId) {
  const [rows] = await connection.query(
    `SELECT * FROM USERS WHERE USER_ID = ? AND IS_DELETED = 0`,
    [userId]
  );
  return rows[0];
}

// 🔍 Dùng cho reset password
async function findForResetPassword(email, phone, fullname) {
  const sql = `
    SELECT * 
    FROM USERS 
    WHERE EMAIL = ? AND PHONE = ? AND FULLNAME = ? AND IS_DELETED = 0
  `;
  const [rows] = await connection.query(sql, [email, phone, fullname]);
  return rows[0];
}

// 🔁 Cập nhật mật khẩu
async function resetPassword(userId, newPasswordHash) {
  const sql = `
    UPDATE USERS
    SET PASSWORD_HASH = ?, UPDATED_AT = NOW()
    // WHERE USER_ID = ? AND IS_DELETED = 0
  `;
  const [result] = await connection.query(sql, [newPasswordHash, userId]);
  return result.affectedRows;
}

async function getAll() {
  const [rows] = await connection.query(`
    SELECT 
      USER_ID, EMAIL, PHONE, ROLE, VERIFIED, FULLNAME, BIRTHDATE,
      AVATAR_URL, ADDRESS, ID_CARD, LICENSE_FRONT_URL, LICENSE_BACK_URL,
      RATING, CREATED_AT, UPDATED_AT,IS_DELETED
    FROM USERS
    WHERE ROLE != 'ADMIN'
    ORDER BY CREATED_AT DESC
  `);
  return rows;
}

// 🧩 Cập nhật thông tin người dùng
async function update(userId, updateData) {
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updateData)) {
    fields.push(`${key.toUpperCase()} = ?`);
    values.push(value);
  }

  if (fields.length === 0) return 0;

  const sql = `
    UPDATE USERS 
    SET ${fields.join(", ")}, UPDATED_AT = NOW()
    WHERE USER_ID = ? AND IS_DELETED = 0
  `;
  values.push(userId);

  const [result] = await connection.query(sql, values);
  return result.affectedRows;
}

// ❌ Xóa mềm người dùng
async function deleteById(userId) {
  const sql = `
    UPDATE USERS 
    SET IS_DELETED = 1, UPDATED_AT = NOW()
    WHERE USER_ID = ? AND IS_DELETED = 0
  `;
  const [result] = await connection.query(sql, [userId]);
  return result.affectedRows;
}
async function reActiveById(userId) {
  const sql = `
    UPDATE USERS 
    SET IS_DELETED = 0, UPDATED_AT = NOW()
    WHERE USER_ID = ? AND IS_DELETED = 1
  `;
  const [result] = await connection.query(sql, [userId]);
  return result.affectedRows;
}
// ✅ Đánh dấu người dùng đã xác minh
async function verifyUser(userId) {
  const sql = `
    UPDATE USERS 
    SET VERIFIED = 1, UPDATED_AT = NOW()
    WHERE USER_ID = ? AND IS_DELETED = 0
  `;
  const [result] = await connection.query(sql, [userId]);
  return result.affectedRows;
}

module.exports = {
  create,
  findByEmail,
  findById,
  findForResetPassword,
  resetPassword,
  getAll,
  update,
  deleteById,
  verifyUser,
  reActiveById,
};
