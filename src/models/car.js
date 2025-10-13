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

  // 🔹 Gộp kết quả và trả về
  return {
    ...car[0],
    images,
    services,
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

const deleteCar = async (carId) => {
  const [result] = await connection.execute(
    "UPDATE CAR SET STATUS = 'DELETED' WHERE CAR_ID = ?",
    [carId]
  );
  return result.affectedRows;
};

const updateCar = async (carId, carData, serviceIds) => {
  let conn = null;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    // 1️⃣ Cập nhật thông tin cơ bản
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
        carData.status,
        carData.pricePerHour,
        carData.pricePerDay,
        carData.branchId,
        carData.description,
        carData.insuranceInfo,
        carData.currentMileage,
        carId,
      ]
    );

    // 2️⃣ Xóa toàn bộ dịch vụ cũ
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

module.exports = {
  createCar,
  getCarById,
  getAllCars,
  deleteCar,
  updateCar,
};
