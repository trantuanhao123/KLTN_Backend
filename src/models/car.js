const { connection } = require("../config/database");
const createCar = async (carData, imageFileNames, serviceIds) => {
  let conn = null;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();
    // 1. Thêm Car
    const [carResult] = await conn.execute(
      `INSERT INTO CAR 
             (LICENSE_PLATE, CATEGORY_ID, BRAND, MODEL, COLOR, TRANSMISSION, FUEL_TYPE, STATUS, PRICE_PER_HOUR, PRICE_PER_DAY, BRANCH_ID, DESCRIPTION, INSURANCE_INFO, CURRENT_MILEAGE) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        carData.licensePlate,
        carData.categoryId,
        carData.brand,
        carData.model,
        carData.color,
        carData.transmission,
        carData.fuelType,
        carData.status,
        carData.pricePerHour,
        carData.pricePerDay,
        carData.branchId,
        carData.description,
        carData.insuranceInfo,
        carData.currentMileage,
      ]
    );
    const carId = carResult.insertId;

    // 2. Thêm Car Images
    if (imageFileNames && imageFileNames.length > 0) {
      const imageValues = imageFileNames.map((fileName, index) => {
        const isMain = index === 0 ? 1 : 0;
        const imageUrl = `${fileName}`; // SỬ DỤNG TÊN FILE DUY NHẤT Ở ĐÂY
        return [carId, imageUrl, isMain];
      });

      const flatValues = imageValues.flat();
      const placeholders = imageValues.map(() => "(?, ?, ?)").join(", ");

      await conn.execute(
        `INSERT INTO CAR_IMAGE (CAR_ID, URL, IS_MAIN) VALUES ${placeholders}`,
        flatValues
      );
    }

    // 3. Thêm Car Services (nếu có)
    if (serviceIds && serviceIds.length > 0) {
      const serviceValues = serviceIds
        .map((serviceId) => [carId, serviceId])
        .flat();
      const placeholders = serviceIds.map(() => "(?, ?)").join(", ");
      await conn.execute(
        `INSERT INTO CAR_SERVICE (CAR_ID, SERVICE_ID) VALUES ${placeholders}`,
        serviceValues
      );
    }

    await conn.commit();
    return carId;
  } catch (error) {
    if (conn) {
      await conn.rollback(); // Đảm bảo rollback nếu có lỗi
    }
    throw error;
  } finally {
    if (conn) {
      conn.release(); // Đảm bảo release kết nối trở lại Pool
    }
  }
};

// ✅ Lấy chi tiết xe đầy đủ với tên chi nhánh và category
const getCarById = async (carId) => {
  // 🔹 Lấy thông tin chi tiết xe, join với bảng CATEGORY và BRANCH
  const [car] = await connection.execute(
    `
    SELECT 
      C.CAR_ID,
      C.LICENSE_PLATE,
      C.BRAND,
      C.MODEL,
      C.COLOR,
      C.TRANSMISSION,
      C.FUEL_TYPE,
      C.STATUS,
      C.PRICE_PER_HOUR,
      C.PRICE_PER_DAY,
      C.DESCRIPTION,
      C.INSURANCE_INFO,
      C.CURRENT_MILEAGE,
      C.CREATED_AT,
      C.RATING,
      CAT.CATEGORY_ID,
      CAT.NAME AS CATEGORY_NAME,
      B.BRANCH_ID,
      B.NAME AS BRANCH_NAME
    FROM CAR C
    LEFT JOIN CATEGORY CAT ON C.CATEGORY_ID = CAT.CATEGORY_ID
    LEFT JOIN BRANCH B ON C.BRANCH_ID = B.BRANCH_ID
    WHERE C.CAR_ID = ?
    `,
    [carId]
  );

  if (car.length === 0) return null;

  // 🔹 Lấy danh sách ảnh
  const [images] = await connection.execute(
    `
    SELECT 
      IMAGE_ID, 
      URL, 
      IS_MAIN 
    FROM CAR_IMAGE 
    WHERE CAR_ID = ? 
    ORDER BY IS_MAIN DESC
    `,
    [carId]
  );

  // 🔹 Lấy danh sách dịch vụ đi kèm
  const [services] = await connection.execute(
    `
    SELECT 
      T1.SERVICE_ID, 
      T2.NAME AS SERVICE_NAME
    FROM CAR_SERVICE T1
    INNER JOIN SERVICE T2 
      ON T1.SERVICE_ID = T2.SERVICE_ID
    WHERE T1.CAR_ID = ?
    `,
    [carId]
  );

  // 🔹 [THÊM] Lấy lịch sử trạng thái
  const [history] = await connection.execute(
    `
    SELECT 
      HISTORY_ID,
      OLD_STATUS,
      NEW_STATUS,
      NOTE,
      CREATED_AT
    FROM CAR_STATUS_HISTORY
    WHERE CAR_ID = ?
    ORDER BY CREATED_AT DESC
    `,
    [carId]
  );

  // 🔹 Gộp kết quả và trả về
  return {
    ...car[0],
    images,
    services,
    history, // [THÊM]
  };
};

/**
 * Lấy danh sách Car
 */
const getAllCars = async () => {
  const [cars] = await connection.execute(
    `SELECT 
        C.*, 
        (SELECT URL 
         FROM CAR_IMAGE CI 
         WHERE CI.CAR_ID = C.CAR_ID 
           AND CI.IS_MAIN = 1 
         LIMIT 1) AS mainImageUrl
     FROM CAR C
     ORDER BY 
        FIELD(C.STATUS, 'AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'DELETED'),
        C.CREATED_AT DESC`
  );
  return cars;
};
const getAllCarsUser = async (filters = {}) => {
  // Basic: only available by default
  const params = [];
  let where = " WHERE 1=1 ";
  if (filters.status) {
    where += " AND C.STATUS = ? ";
    params.push(filters.status);
  } else {
    // default show available
    where += " AND C.STATUS = 'AVAILABLE' ";
  }
  if (filters.branchId) {
    where += " AND C.BRANCH_ID = ? ";
    params.push(filters.branchId);
  }
  const [rows] = await connection.execute(
    `
    SELECT 
      C.*, 
      (SELECT URL FROM CAR_IMAGE CI WHERE CI.CAR_ID = C.CAR_ID AND CI.IS_MAIN = 1 LIMIT 1) AS mainImageUrl
    FROM CAR C
    ${where}
    ORDER BY FIELD(C.STATUS, 'AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'DELETED'), C.CREATED_AT DESC
    `,
    params
  );
  return rows;
};
const deleteCar = async (carId) => {
  // [SỬA ĐỔI] Chuyển sang transaction để lấy status cũ và ghi log
  let conn = null;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    // 1. Lấy trạng thái cũ
    const [rows] = await conn.execute(
      "SELECT STATUS FROM CAR WHERE CAR_ID = ? FOR UPDATE",
      [carId]
    );
    if (rows.length === 0) throw new Error(`Car ID ${carId} not found.`);
    const oldStatus = rows[0].STATUS;
    const newStatus = "DELETED";

    // 2. Cập nhật
    const [result] = await conn.execute(
      "UPDATE CAR SET STATUS = ? WHERE CAR_ID = ?",
      [newStatus, carId]
    );

    // 3. Ghi log
    await logStatusChange(
      carId,
      oldStatus,
      newStatus,
      "Admin xóa mềm xe (soft delete)",
      conn
    );

    await conn.commit();
    return result.affectedRows;
  } catch (error) {
    if (conn) await conn.rollback();
    throw error;
  } finally {
    if (conn) conn.release();
  }
};

const updateCarStatus = async (carId, status, conn = connection) => {
  // if conn is pool, it will execute; if it's a transaction connection, it's fine too
  const sql = `UPDATE CAR SET STATUS = ? WHERE CAR_ID = ?`;
  const [res] = await conn.execute(sql, [status, carId]);
  return res.affectedRows;
};
const updateCar = async (carId, carData, serviceIds) => {
  let conn = null;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    // [THÊM] Lấy trạng thái cũ
    const [rows] = await conn.execute(
      "SELECT STATUS FROM CAR WHERE CAR_ID = ? FOR UPDATE",
      [carId]
    );
    if (rows.length === 0) throw new Error(`Car ID ${carId} not found.`);
    const oldStatus = rows[0].STATUS;
    const newStatus = carData.status; // Lấy trạng thái mới từ input

    // 1️⃣ Cập nhật thông tin cơ bản (như cũ)
    await conn.execute(
      `
      UPDATE CAR
      SET 
        LICENSE_PLATE = ?, 
        CATEGORY_ID = ?, 
        BRAND = ?, 
        MODEL = ?, 
        COLOR = ?, 
        TRANSMISSION = ?, 
        FUEL_TYPE = ?, 
        STATUS = ?, 
        PRICE_PER_HOUR = ?, 
        PRICE_PER_DAY = ?, 
        BRANCH_ID = ?, 
        DESCRIPTION = ?, 
        INSURANCE_INFO = ?, 
        CURRENT_MILEAGE = ?
      WHERE CAR_ID = ?
      `,
      [
        carData.licensePlate,
        carData.categoryId,
        carData.brand,
        carData.model,
        carData.color,
        carData.transmission,
        carData.fuelType,
        carData.status, // newStatus
        carData.pricePerHour,
        carData.pricePerDay,
        carData.branchId,
        carData.description,
        carData.insuranceInfo,
        carData.currentMileage,
        carId,
      ]
    );

    // [THÊM] Ghi log nếu trạng thái thay đổi
    if (oldStatus !== newStatus) {
      await logStatusChange(
        carId,
        oldStatus,
        newStatus,
        "Admin cập nhật thông tin xe",
        conn
      );
    }

    // 2️⃣ Xóa toàn bộ dịch vụ cũ (như cũ)
    await conn.execute(`DELETE FROM CAR_SERVICE WHERE CAR_ID = ?`, [carId]);

    // 3️⃣ Thêm dịch vụ mới (nếu có)
    if (serviceIds && serviceIds.length > 0) {
      const placeholders = serviceIds.map(() => "(?, ?)").join(", ");
      const flatValues = serviceIds.map((sid) => [carId, sid]).flat();
      await conn.execute(
        `INSERT INTO CAR_SERVICE (CAR_ID, SERVICE_ID) VALUES ${placeholders}`,
        flatValues
      );
    }

    await conn.commit();
    return true;
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
};
/**
 * Hàm ghi log thay đổi trạng thái
 */
const logStatusChange = async (
  carId,
  oldStatus,
  newStatus,
  note,
  conn = connection
) => {
  // Bỏ qua nếu trạng thái không đổi
  if (oldStatus === newStatus) {
    return;
  }

  try {
    const sql = `
      INSERT INTO CAR_STATUS_HISTORY 
        (CAR_ID, OLD_STATUS, NEW_STATUS, NOTE) 
      VALUES (?, ?, ?, ?)
    `;
    await conn.execute(sql, [
      carId,
      oldStatus,
      newStatus,
      note || "Cập nhật trạng thái.",
    ]);
  } catch (error) {
    // Không nên để lỗi ghi log làm hỏng transaction chính
    // Nếu muốn bắt buộc log, hãy bỏ try...catch
    console.error(
      `LỖI GHI LOG (Bỏ qua): Không thể ghi lịch sử cho CAR_ID ${carId}`,
      error
    );
  }
};
module.exports = {
  createCar,
  getCarById,
  getAllCars,
  deleteCar,
  updateCar,
  getAllCarsUser,
  updateCarStatus,
  logStatusChange,
};
