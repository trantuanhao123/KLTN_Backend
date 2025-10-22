// src/models/discountModel.js
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

const incrementUsedCount = async (discountId, conn) => {
  const [result] = await conn.execute(
    "UPDATE DISCOUNT SET USED_COUNT = USED_COUNT + 1 WHERE DISCOUNT_ID = ?",
    [discountId]
  );
  return result.affectedRows;
};

module.exports = {
  findValidCode,
  incrementUsedCount,
};
