const { connection } = require("../config/database");

/**
 * Tạo sự cố mới (dùng trong transaction)
 */
const create = async (incidentData, conn = connection) => {
  const { ORDER_ID, USER_ID, CAR_ID, DESCRIPTION } = incidentData;
  const sql = `
    INSERT INTO INCIDENT (ORDER_ID, USER_ID, CAR_ID, DESCRIPTION, STATUS, CREATED_AT)
    VALUES (?, ?, ?, ?, 'NEW', NOW())
  `;
  const [result] = await conn.execute(sql, [
    ORDER_ID,
    USER_ID,
    CAR_ID,
    DESCRIPTION,
  ]);
  return result.insertId;
};

/**
 * Kiểm tra xem đơn hàng đã có sự cố chưa
 */
const findByOrderId = async (orderId, conn = connection) => {
  const sql = `
    SELECT 
      i.*, 
      o.ORDER_CODE AS order_code,
      u.FULLNAME AS customer_name,
      u.PHONE AS customer_phone,
      c.BRAND AS car_brand,
      c.MODEL AS car_model,
      c.LICENSE_PLATE AS car_license_plate
    FROM 
      INCIDENT AS i
    LEFT JOIN 
      RENTAL_ORDER AS o ON i.ORDER_ID = o.ORDER_ID
    LEFT JOIN 
      USERS AS u ON i.USER_ID = u.USER_ID
    LEFT JOIN 
      CAR AS c ON i.CAR_ID = c.CAR_ID
    WHERE 
      i.ORDER_ID = ? 
    LIMIT 1
  `;
  const [rows] = await conn.query(sql, [orderId]);
  return rows[0];
};

/**
 * Lấy sự cố theo ID
 */
const findById = async (incidentId, conn = connection) => {
  const sql = `
    SELECT 
      i.*, 
      o.ORDER_CODE AS order_code,
      u.FULLNAME AS customer_name,
      u.PHONE AS customer_phone,
      c.BRAND AS car_brand,
      c.MODEL AS car_model,
      c.LICENSE_PLATE AS car_license_plate
    FROM 
      INCIDENT AS i
    LEFT JOIN 
      RENTAL_ORDER AS o ON i.ORDER_ID = o.ORDER_ID
    LEFT JOIN 
      USERS AS u ON i.USER_ID = u.USER_ID
    LEFT JOIN 
      CAR AS c ON i.CAR_ID = c.CAR_ID
    WHERE 
      i.INCIDENT_ID = ?
  `;
  const [rows] = await conn.query(sql, [incidentId]);
  return rows[0];
};

/**
 * Lấy danh sách sự cố (cho Admin)
 */
const findAll = async (conn = connection) => {
  const sql = `
    SELECT 
      i.*, 
      o.ORDER_CODE AS order_code,
      u.FULLNAME AS customer_name,
      c.BRAND AS car_brand,
      c.MODEL AS car_model,
      c.LICENSE_PLATE AS car_license_plate
    FROM 
      INCIDENT AS i
    LEFT JOIN 
      RENTAL_ORDER AS o ON i.ORDER_ID = o.ORDER_ID
    LEFT JOIN 
      USERS AS u ON i.USER_ID = u.USER_ID
    LEFT JOIN 
      CAR AS c ON i.CAR_ID = c.CAR_ID
    ORDER BY 
      i.CREATED_AT DESC
  `;
  const [rows] = await conn.query(sql);
  return rows;
};

/**
 * Cập nhật mô tả (User)
 */
const updateDescription = async (
  incidentId,
  description,
  userId,
  conn = connection
) => {
  const sql =
    "UPDATE INCIDENT SET DESCRIPTION = ? WHERE INCIDENT_ID = ? AND USER_ID = ?";
  const [result] = await conn.execute(sql, [description, incidentId, userId]);
  return result.affectedRows;
};

/**
 * Cập nhật trạng thái (Admin)
 */
const updateStatus = async (incidentId, status, conn = connection) => {
  // Nếu là 'RESOLVED' hoặc 'CLOSED' thì cập nhật RESOLVED_AT
  const resolvedAt =
    status === "RESOLVED" || status === "CLOSED" ? "NOW()" : "NULL";

  const sql = `
    UPDATE INCIDENT 
    SET STATUS = ?, RESOLVED_AT = ${resolvedAt} 
    WHERE INCIDENT_ID = ?
  `;
  const [result] = await conn.execute(sql, [status, incidentId]);
  return result.affectedRows;
};

/**
 * Xóa sự cố
 * (ON DELETE CASCADE sẽ tự xóa INCIDENT_MEDIA)
 */
const remove = async (incidentId, conn = connection) => {
  const sql = "DELETE FROM INCIDENT WHERE INCIDENT_ID = ?";
  const [result] = await conn.execute(sql, [incidentId]);
  return result.affectedRows;
};

module.exports = {
  create,
  findByOrderId,
  findById,
  findAll,
  updateDescription,
  updateStatus,
  remove,
};
