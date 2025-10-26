const { connection } = require("../config/database");

const findValidCode = async (code, conn = connection) => {
  const [rows] = await conn.execute(
    `SELECT * FROM DISCOUNT 
     WHERE CODE = ? 
       AND STATUS = 'ACTIVE'
       AND (START_DATE IS NULL OR START_DATE <= CURDATE())
       AND (END_DATE IS NULL OR END_DATE >= CURDATE())
       AND (QUANTITY IS NULL OR USED_COUNT < QUANTITY)`,
    [code]
  );
  return rows[0];
};

const incrementUsedCount = async (discountId, conn = connection) => {
  const [result] = await conn.execute(
    `UPDATE DISCOUNT
     SET
       USED_COUNT = USED_COUNT + 1,
       STATUS = CASE
         WHEN (USED_COUNT + 1) >= QUANTITY AND QUANTITY IS NOT NULL THEN 'EXPIRED'
         ELSE STATUS
       END
     WHERE DISCOUNT_ID = ?`,
    [discountId]
  );
  return result.affectedRows;
};
// Tạo mới một mã giảm giá
const create = async (discountData, conn = connection) => {
  const { CODE, NAME, TYPE, VALUE, START_DATE, END_DATE, QUANTITY, STATUS } =
    discountData;
  const [result] = await conn.execute(
    "INSERT INTO DISCOUNT (CODE, NAME, TYPE, VALUE, START_DATE, END_DATE, QUANTITY, STATUS) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      CODE,
      NAME,
      TYPE,
      VALUE,
      START_DATE,
      END_DATE,
      QUANTITY,
      STATUS || "ACTIVE",
    ]
  );
  return result.insertId;
};

// Lấy tất cả mã
const findAll = async (conn = connection) => {
  // Giả sử bạn có cột CREATED_AT, nếu không hãy ORDER BY DISCOUNT_ID DESC
  const [rows] = await conn.execute(
    "SELECT * FROM DISCOUNT ORDER BY DISCOUNT_ID DESC"
  );
  return rows;
};

// Tìm theo ID
const findById = async (id, conn = connection) => {
  const [rows] = await conn.execute(
    "SELECT * FROM DISCOUNT WHERE DISCOUNT_ID = ?",
    [id]
  );
  return rows[0];
};

// Tìm theo CODE (dùng cho nghiệp vụ check và kiểm tra trùng)
// Hàm này tìm BẤT KỲ mã nào, kể cả hết hạn
const findByCode = async (code, conn = connection) => {
  const [rows] = await conn.execute("SELECT * FROM DISCOUNT WHERE CODE = ?", [
    code,
  ]);
  return rows[0];
};

// Cập nhật mã
const update = async (id, discountData, conn = connection) => {
  const fields = Object.keys(discountData);
  const values = Object.values(discountData);

  if (fields.length === 0) return 0;

  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  const query = `UPDATE DISCOUNT SET ${setClause} WHERE DISCOUNT_ID = ?`;
  values.push(id);

  const [result] = await conn.execute(query, values);
  return result.affectedRows;
};

// Xóa mã
const remove = async (id, conn = connection) => {
  const [result] = await conn.execute(
    "DELETE FROM DISCOUNT WHERE DISCOUNT_ID = ?",
    [id]
  );
  return result.affectedRows;
};

/**
 * [NGHIỆP VỤ XÓA]
 * Kiểm tra xem mã giảm giá đã được sử dụng trong bất kỳ RENTAL_ORDER nào chưa
 */
const checkOrderUsage = async (discountId, conn = connection) => {
  const [rows] = await conn.execute(
    "SELECT 1 FROM RENTAL_ORDER WHERE DISCOUNT_ID = ? LIMIT 1",
    [discountId]
  );
  return rows.length > 0;
};
module.exports = {
  create,
  findAll,
  findById,
  findByCode,
  update,
  remove,
  findValidCode,
  incrementUsedCount,
  checkOrderUsage,
};
