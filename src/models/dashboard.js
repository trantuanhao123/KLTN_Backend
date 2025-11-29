// models/dashboard.js
const { connection } = require("../config/database");

/**
 * 1. Tổng doanh thu (theo tháng)
 * Không có tham số -> dùng execute hay query đều được.
 */
const getMonthlyRevenue = async () => {
  const sql = `
    SELECT
      DATE_FORMAT(TRANSACTION_DATE, '%Y-%m') AS month,
      SUM(AMOUNT) AS totalRevenue
    FROM PAYMENT
    WHERE 
      STATUS = 'SUCCESS' 
      AND PAYMENT_TYPE != 'REFUND'
    GROUP BY month
    ORDER BY month DESC;
  `;
  const [rows] = await connection.execute(sql);
  return rows;
};

/**
 * 2. Lượt thuê theo tuần
 * Limit cứng 12 -> dùng execute được.
 */
const getWeeklyRentalCount = async () => {
  const sql = `
    SELECT
      YEAR(START_DATE) AS year,
      WEEK(START_DATE, 1) AS week,
      COUNT(ORDER_ID) AS rentalCount
    FROM RENTAL_ORDER
    WHERE STATUS IN ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED')
    GROUP BY year, week
    ORDER BY year DESC, week DESC
    LIMIT 12; 
  `;
  const [rows] = await connection.execute(sql);
  return rows;
};

/**
 * 3. Lịch thuê gần đây (limit 3)
 * [FIX]: Dùng connection.query thay vì execute vì có LIMIT ?
 * [FIX]: Ép kiểu Number(limit) để đảm bảo an toàn
 */
const getRecentRentals = async (limit = 3) => {
  const sql = `
    SELECT
      ro.ORDER_ID, ro.ORDER_CODE, ro.STATUS, ro.START_DATE, ro.FINAL_AMOUNT,
      u.FULLNAME AS userName,
      c.BRAND, c.MODEL, c.LICENSE_PLATE
    FROM RENTAL_ORDER ro
    LEFT JOIN \`USERS\` u ON ro.USER_ID = u.USER_ID 
    LEFT JOIN CAR c ON ro.CAR_ID = c.CAR_ID
    ORDER BY ro.CREATED_AT DESC
    LIMIT ?;
  `;
  // SỬ DỤNG QUERY
  const [rows] = await connection.query(sql, [Number(limit)]);
  return rows;
};

/**
 * 4. Báo cáo sự cố gần đây (limit 3)
 * [FIX]: Dùng connection.query thay vì execute
 */
const getRecentIncidents = async (limit = 3) => {
  const sql = `
    SELECT
      i.INCIDENT_ID, i.STATUS, i.DESCRIPTION, i.CREATED_AT,
      ro.ORDER_CODE,
      u.FULLNAME AS userName
    FROM INCIDENT i
    LEFT JOIN RENTAL_ORDER ro ON i.ORDER_ID = ro.ORDER_ID
    LEFT JOIN \`USERS\` u ON i.USER_ID = u.USER_ID 
    ORDER BY i.CREATED_AT DESC
    LIMIT ?;
  `;
  // SỬ DỤNG QUERY
  const [rows] = await connection.query(sql, [Number(limit)]);
  return rows;
};

/**
 * 5. Doanh thu theo loại xe
 * Không tham số -> execute ok
 */
const getRevenueByCategory = async () => {
  const sql = `
    SELECT
      cat.NAME AS categoryName,
      SUM(p.AMOUNT) AS totalRevenue,
      COUNT(DISTINCT ro.ORDER_ID) as rentalCount
    FROM PAYMENT p
    JOIN RENTAL_ORDER ro ON p.ORDER_ID = ro.ORDER_ID
    JOIN CAR c ON ro.CAR_ID = c.CAR_ID
    JOIN CATEGORY cat ON c.CATEGORY_ID = cat.CATEGORY_ID
    WHERE 
      p.STATUS = 'SUCCESS' 
      AND p.PAYMENT_TYPE != 'REFUND'
    GROUP BY cat.CATEGORY_ID, cat.NAME
    ORDER BY totalRevenue DESC;
  `;
  const [rows] = await connection.execute(sql);
  return rows;
};

/**
 * 6. Xe được thuê nhiều nhất
 * [FIX]: Dùng connection.query thay vì execute vì có LIMIT ?
 */
const getMostRentedCars = async (limit = 5) => {
  const sql = `
    SELECT
      c.CAR_ID, c.BRAND, c.MODEL, c.LICENSE_PLATE,
      (SELECT URL FROM CAR_IMAGE CI WHERE CI.CAR_ID = c.CAR_ID AND CI.IS_MAIN = 1 LIMIT 1) AS mainImageUrl,
      COUNT(ro.ORDER_ID) AS rentalCount
    FROM RENTAL_ORDER ro
    JOIN CAR c ON ro.CAR_ID = c.CAR_ID
    WHERE ro.STATUS IN ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED')
    GROUP BY c.CAR_ID, c.BRAND, c.MODEL, c.LICENSE_PLATE
    ORDER BY rentalCount DESC
    LIMIT ?;
  `;
  // SỬ DỤNG QUERY
  const [rows] = await connection.query(sql, [Number(limit)]);
  return rows;
};

/**
 * [BONUS] Các chỉ số tổng quan nhanh
 * Các query đơn giản -> execute ok
 */
const getDashboardStats = async () => {
  // Query 1
  const [revenue] = await connection.execute(`
    SELECT SUM(AMOUNT) AS totalRevenue 
    FROM PAYMENT 
    WHERE STATUS = 'SUCCESS' AND PAYMENT_TYPE != 'REFUND'
  `);

  // Query 2
  const [rentals] = await connection.execute(`
    SELECT COUNT(ORDER_ID) AS totalRentals 
    FROM RENTAL_ORDER 
    WHERE STATUS IN ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED')
  `);

  // Query 3
  const [users] = await connection.execute(`
    SELECT COUNT(USER_ID) AS totalUsers 
    FROM \`USERS\` 
    WHERE ROLE = 'CUSTOMER'
  `);

  // Query 4
  const [cars] = await connection.execute(`
    SELECT COUNT(CAR_ID) AS totalCars 
    FROM CAR 
    WHERE STATUS != 'DELETED'
  `);

  return {
    totalRevenue: revenue[0].totalRevenue || 0,
    totalRentals: rentals[0].totalRentals || 0,
    totalUsers: users[0].totalUsers || 0,
    totalCars: cars[0].totalCars || 0,
  };
};

module.exports = {
  getMonthlyRevenue,
  getWeeklyRentalCount,
  getRecentRentals,
  getRecentIncidents,
  getRevenueByCategory,
  getMostRentedCars,
  getDashboardStats,
};
