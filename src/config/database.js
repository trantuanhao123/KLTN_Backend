require("dotenv").config();
const mysql = require("mysql2/promise");

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "CAR_RENTAL",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
async function checkConnection() {
  let conn; // Biến tạm để giữ kết nối đơn lẻ lấy ra từ pool
  try {
    console.log("Đang kiểm tra kết nối cơ sở dữ liệu...");

    // Lấy một kết nối từ pool ('connection') để kiểm tra
    conn = await connection.getConnection();

    // Trả lại kết nối vào pool ngay sau khi kiểm tra
    conn.release();

    console.log("✅ Kết nối DB thành công! Pool đã sẵn sàng.");
    return connection; // Trả về đối tượng Pool (connection)
  } catch (error) {
    console.error(
      "❌ LỖI KẾT NỐI DB! Vui lòng kiểm tra thông số:",
      error.message
    );
    // Ném lỗi để dừng ứng dụng nếu không thể kết nối
    throw new Error("Database connection failed: " + error.message);
  }
}
module.exports = {
  connection,
  checkConnection,
};
