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

    // A. TÌM KIẾM USER
    const [existingUsers] = await conn.execute(
      `SELECT USER_ID, PROVIDER, PROVIDER_ID, ROLE
             FROM USERS 
             WHERE (PROVIDER_ID = ? AND PROVIDER = ?) OR (EMAIL = ?)`,
      [googleId, PROVIDER_NAME, email]
    );

    const userRecord = existingUsers.length > 0 ? existingUsers[0] : null;

    if (userRecord) {
      // B. CẬP NHẬT USER CŨ
      userId = userRecord.USER_ID;

      if (userRecord.PROVIDER === PROVIDER_NAME) {
        await conn.execute(
          `UPDATE USERS 
             SET FULLNAME = ?, AVATAR_URL = ?, UPDATED_AT = CURRENT_TIMESTAMP 
             WHERE USER_ID = ?`,
          [fullName, avatarUrl, userId]
        );
      } else {
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
      // C. TẠO USER MỚI
      const [result] = await conn.execute(
        `INSERT INTO USERS 
           (EMAIL, PROVIDER, PROVIDER_ID, FULLNAME, AVATAR_URL, IS_EMAIL_VERIFIED, VERIFIED, ROLE) 
           VALUES (?, ?, ?, ?, ?, 1, 1, 'CUSTOMER')`,
        [email, PROVIDER_NAME, googleId, fullName, avatarUrl]
      );
      userId = result.insertId;
    }

    await conn.commit();

    // --- TẠO JWT TOKEN (PHIÊN BẢN VẠN NĂNG) ---
    const finalRole = userRecord ? userRecord.ROLE : "CUSTOMER";
    
    // Dùng Secret mặc định nếu .env lỗi (giống userService)
    const secret = process.env.JWT_SECRET || "khongdoanduocdau";

    const token = jwt.sign(
      {
        // [AN TOÀN] Truyền cả 2 kiểu tên biến vào Token
        // 1. Kiểu cũ (camelCase) -> Để Admin Web và các service cũ hoạt động bình thường
        userId: userId,
        role: finalRole,

        // 2. Kiểu mới (UPPERCASE) -> Để Mobile App (RentalController) hoạt động
        USER_ID: userId, 
        EMAIL: email,
        ROLE: finalRole,
      },
      secret,
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