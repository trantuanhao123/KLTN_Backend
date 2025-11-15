const { connection } = require("../config/database");

// Tạo người dùng mới
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

// Tìm theo email
async function findByEmail(email) {
  const [rows] = await connection.query(`SELECT * FROM USERS WHERE EMAIL = ?`, [
    email,
  ]);
  return rows[0];
}

// Tìm theo ID
async function findById(userId) {
  const [rows] = await connection.query(
    `SELECT * FROM USERS WHERE USER_ID = ? AND IS_DELETED = 0`,
    [userId]
  );
  return rows[0];
}

// Cập nhật mật khẩu
async function resetPassword(userId, newPasswordHash) {
  const sql = `
    UPDATE USERS
    SET PASSWORD_HASH = ?, UPDATED_AT = NOW()
    WHERE USER_ID = ? AND IS_DELETED = 0
  `;
  const [result] = await connection.query(sql, [newPasswordHash, userId]);
  return result.affectedRows;
}

async function getAll() {
  const [rows] = await connection.query(`
    SELECT 
      u.USER_ID, u.EMAIL, u.PHONE, u.ROLE, u.VERIFIED, u.FULLNAME, u.BIRTHDATE,
      u.AVATAR_URL, u.ADDRESS, u.ID_CARD, u.LICENSE_FRONT_URL, u.LICENSE_BACK_URL,
      u.RATING, u.CREATED_AT, u.UPDATED_AT, u.IS_DELETED,
      
      (SELECT COUNT(*) 
       FROM RENTAL_ORDER ro 
       WHERE ro.USER_ID = u.USER_ID) AS orderCount
       
    FROM USERS u
    WHERE u.ROLE != 'ADMIN'
    ORDER BY u.CREATED_AT DESC
  `);
  return rows;
}

// Cập nhật thông tin người dùng
async function updateProfileInfo(userId, profileData) {
  // Chỉ cho phép cập nhật những trường này
  const allowedFields = [
    "FULLNAME",
    "BIRTHDATE",
    "ADDRESS",
    "PHONE",
    "ID_CARD",
  ];

  const fields = [];
  const values = [];

  for (const key of allowedFields) {
    // Nếu client có gửi lên dữ liệu cho trường được phép
    if (profileData[key.toLowerCase()] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(profileData[key.toLowerCase()]);
    }
  }

  // Nếu không có trường nào hợp lệ để cập nhật
  if (fields.length === 0) {
    return 0;
  }

  values.push(userId);

  const sql = `
    UPDATE USERS
    SET ${fields.join(", ")}
    WHERE USER_ID = ?
  `;

  const [result] = await connection.query(sql, values);
  return result.affectedRows;
}

// Cập nhật URL ảnh đại diện (avatar)
async function updateAvatar(userId, avatarUrl) {
  const sql = `
    UPDATE USERS 
    SET AVATAR_URL = ?
    WHERE USER_ID = ?
  `;
  const [result] = await connection.query(sql, [avatarUrl, userId]);
  return result.affectedRows;
}

// Cập nhật URL bằng lái xe
async function updateLicense(userId, licenseUrls) {
  const sql = `
    UPDATE USERS 
    SET 
      LICENSE_FRONT_URL = ?, 
      LICENSE_BACK_URL = ?,
      VERIFIED = 0,
    WHERE USER_ID = ?
  `;
  const [result] = await connection.query(sql, [
    licenseUrls.frontUrl,
    licenseUrls.backUrl,
    userId,
  ]);
  return result.affectedRows;
}

// Xóa mềm người dùng
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

async function updateUnverifiedUser(userId, { phone, passwordHash, fullname }) {
  const sql = `
    UPDATE USERS
    SET PHONE = ?, PASSWORD_HASH = ?, FULLNAME = ?, UPDATED_AT = NOW()
    WHERE USER_ID = ? AND IS_EMAIL_VERIFIED = 0
  `;
  const [result] = await connection.query(sql, [
    phone,
    passwordHash,
    fullname,
    userId,
  ]);
  return result.affectedRows;
}

// SET EMAIL ĐÃ XÁC THỰC
async function setEmailAsVerified(userId) {
  const sql = `
    UPDATE USERS 
    SET IS_EMAIL_VERIFIED = 1, UPDATED_AT = NOW()
    WHERE USER_ID = ?
  `;
  const [result] = await connection.query(sql, [userId]);
  return result.affectedRows;
}
// Đánh dấu người dùng đã xác minh
async function verifyUser(userId) {
  const sql = `
    UPDATE USERS 
    SET VERIFIED = 1, UPDATED_AT = NOW()
    WHERE USER_ID = ? AND IS_DELETED = 0
  `;
  const [result] = await connection.query(sql, [userId]);
  return result.affectedRows;
}
async function unverifyUser(userId) {
  const sql = `
    UPDATE USERS 
    SET VERIFIED = 0, UPDATED_AT = NOW()
    WHERE USER_ID = ? AND IS_DELETED = 0
  `;
  const [result] = await connection.query(sql, [userId]);
  return result.affectedRows;
}
async function findByRole(role, conn = connection) {
  const [rows] = await conn.query(
    `SELECT * FROM USERS WHERE ROLE = ? AND IS_DELETED = 0 LIMIT 1`,
    [role]
  );
  return rows[0];
}
// Lấy danh sách user nhẹ cho dropdown (chỉ ID và tên/email)
async function getForDropdown(conn = connection) {
  const sql = `
    SELECT 
      USER_ID, 
      FULLNAME, 
      EMAIL 
    FROM USERS 
    WHERE ROLE != 'ADMIN' AND IS_DELETED = 0
    ORDER BY FULLNAME
  `;
  const [rows] = await conn.query(sql);
  return rows;
}
// Cập nhật Rating cho người dùng
async function updateRating(userId, newRating) {
  const sql = `
    UPDATE USERS
    SET RATING = 
      CASE
        -- TH1: Rating cũ (RATING) là NULL/0.00 (chưa có) -> Gán rating mới
        WHEN RATING IS NULL OR RATING = 0.00 THEN ?
        -- TH2: Rating cũ đã có -> Tính trung bình cộng (RATING + newRating) / 2
        ELSE (RATING + ?) / 2
      END,
      UPDATED_AT = NOW()
    WHERE USER_ID = ? AND IS_DELETED = 0
`;
  const [result] = await connection.query(sql, [newRating, newRating, userId]);
  return result.affectedRows;
}
module.exports = {
  create,
  findByEmail,
  findById,
  resetPassword,
  getAll,
  updateAvatar,
  updateLicense,
  updateProfileInfo,
  deleteById,
  verifyUser,
  unverifyUser,
  reActiveById,
  updateUnverifiedUser,
  setEmailAsVerified,
  findByRole,
  getForDropdown,
  updateRating,
};
