// src/services/carService.js
const carModel = require("../models/car");

const createNewCar = async (carData, files) => {
  // Lấy danh sách tên file đã được Multer đặt
  const imageFileNames = files.map((file) => file.filename);

  // Giả định carData.serviceIds là chuỗi các ID cách nhau bằng dấu phẩy
  const serviceIds = carData.serviceIds
    ? carData.serviceIds
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id))
    : [];

  try {
    const newCarId = await carModel.createCar(
      carData,
      imageFileNames,
      serviceIds
    );
    return { carId: newCarId, message: "Car created successfully" };
  } catch (error) {
    console.error("Error creating car:", error);
    throw new Error("Could not create car due to a database error.");
  }
};

/**
 * Xử lý lấy chi tiết Car
 */
const getCarDetails = async (carId) => {
  const car = await carModel.getCarById(carId);
  if (!car) {
    throw new Error(`Car with ID ${carId} not found.`);
  }
  return car;
};

/**
 * Xử lý lấy danh sách Car
 */
const getCarList = async () => {
  return await carModel.getAllCars();
};

/**
 * Xử lý xóa Car
 */
const deleteExistingCar = async (carId) => {
  const affectedRows = await carModel.deleteCar(carId);
  if (affectedRows === 0) {
    throw new Error(`Car with ID ${carId} not found.`);
  }
  return { message: "Car deleted successfully" };
};

module.exports = {
  createNewCar,
  getCarDetails,
  getCarList,
  deleteExistingCar,
  // ...
};
