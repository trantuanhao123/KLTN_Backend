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
module.exports = connection;
