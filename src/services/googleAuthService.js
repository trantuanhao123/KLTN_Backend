const { connection } = require("../config/database");
const jwt = require("jsonwebtoken");
const PROVIDER_NAME = "GOOGLE";

async function handleGoogleUpsert(userData) {
  const { googleId, email, fullName, avatarUrl } = userData;
  let conn;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    let userId;

    // A. TÌM KIẾM: Ưu tiên Provider ID, sau đó là Email
    const [existingUsers] = await conn.execute(
      `SELECT USER_ID, PROVIDER, PROVIDER_ID, ROLE
             FROM USERS 
             WHERE (PROVIDER_ID = ? AND PROVIDER = ?) OR (EMAIL = ?)`,
      [googleId, PROVIDER_NAME, email]
    );

    const userRecord = existingUsers.length > 0 ? existingUsers[0] : null;

    if (userRecord) {
      // B. ĐĂNG NHẬP / CẬP NHẬT
      userId = userRecord.USER_ID;

      if (userRecord.PROVIDER === PROVIDER_NAME) {
        // Trường hợp 1: Tài khoản Google đã tồn tại -> Cập nhật profile (Đăng nhập)
        await conn.execute(
          `UPDATE USERS 
                     SET FULLNAME = ?, AVATAR_URL = ?, UPDATED_AT = CURRENT_TIMESTAMP 
                     WHERE USER_ID = ?`,
          [fullName, avatarUrl, userId]
        );
      } else {
        // Trường hợp 2: Tài khoản Local/Khác (trùng Email) -> Liên kết Google
        await conn.execute(
          `UPDATE USERS 
                     SET PROVIDER = ?, PROVIDER_ID = ?, 
                         FULLNAME = COALESCE(FULLNAME, ?), AVATAR_URL = COALESCE(AVATAR_URL, ?),
                         IS_EMAIL_VERIFIED = 1, VERIFIED = 1, UPDATED_AT = CURRENT_TIMESTAMP 
                     WHERE USER_ID = ?`,
          [PROVIDER_NAME, googleId, fullName, avatarUrl, userId]
        );
      }
    } else {
      // C. ĐĂNG KÝ: Tài khoản mới hoàn toàn
      const [result] = await conn.execute(
        `INSERT INTO USERS 
                 (EMAIL, PROVIDER, PROVIDER_ID, FULLNAME, AVATAR_URL, IS_EMAIL_VERIFIED, VERIFIED, ROLE) 
                 VALUES (?, ?, ?, ?, ?, 1, 1, 'CUSTOMER')`,
        [email, PROVIDER_NAME, googleId, fullName, avatarUrl]
      );
      userId = result.insertId;
    }

    await conn.commit();

    // TẠO JWT
    const finalRole = userRecord ? userRecord.ROLE : "CUSTOMER";

    const token = jwt.sign(
      {
        user_id: userId,
        email: email,
        role: finalRole,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );
    return { token, userId };
  } catch (error) {
    if (conn) await conn.rollback();
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  handleGoogleUpsert,
};
