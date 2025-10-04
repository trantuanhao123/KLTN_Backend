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
        const imageUrl = `/images/${fileName}`; // SỬ DỤNG TÊN FILE DUY NHẤT Ở ĐÂY
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

const getCarById = async (carId) => {
  const [car] = await connection.execute("SELECT * FROM CAR WHERE CAR_ID = ?", [
    carId,
  ]);
  if (car.length === 0) return null;

  const [images] = await connection.execute(
    "SELECT IMAGE_ID, URL, IS_MAIN FROM CAR_IMAGE WHERE CAR_ID = ? ORDER BY IS_MAIN DESC",
    [carId]
  );

  // Sử dụng JOIN để lấy tên Service
  const [services] = await connection.execute(
    `SELECT T1.SERVICE_ID, T2.NAME
         FROM CAR_SERVICE T1
         INNER JOIN SERVICE T2 ON T1.SERVICE_ID = T2.SERVICE_ID
         WHERE T1.CAR_ID = ?`,
    [carId]
  );

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
  // Lấy thông tin Car cơ bản và Main Image (sử dụng Subquery hoặc LEFT JOIN)
  const [cars] = await connection.execute(
    `SELECT 
            C.*, 
            (SELECT URL FROM CAR_IMAGE CI WHERE CI.CAR_ID = C.CAR_ID AND CI.IS_MAIN = 1 LIMIT 1) AS mainImageUrl
         FROM CAR C
         ORDER BY C.CREATED_AT DESC`
  );
  return cars;
};

/**
 * Xóa một Car và các bản ghi liên quan (nhờ ON DELETE CASCADE)
 * @param {number} carId - ID của Car
 */
const deleteCar = async (carId) => {
  // ON DELETE CASCADE sẽ tự động xóa các bản ghi trong CAR_IMAGE và CAR_SERVICE
  const [result] = await connection.execute(
    "DELETE FROM CAR WHERE CAR_ID = ?",
    [carId]
  );
  return result.affectedRows;
};

// ... Thêm hàm updateCar nếu cần

module.exports = {
  createCar,
  getCarById,
  getAllCars,
  deleteCar,
};
