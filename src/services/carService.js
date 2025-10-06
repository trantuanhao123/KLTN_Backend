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

const getCarDetails = async (carId) => {
  const car = await carModel.getCarById(carId);
  if (!car) {
    throw new Error(`Car with ID ${carId} not found.`);
  }
  return car;
};

const getCarList = async () => {
  return await carModel.getAllCars();
};

const deleteExistingCar = async (carId) => {
  const affectedRows = await carModel.deleteCar(carId);
  if (affectedRows === 0) {
    throw new Error(`Car with ID ${carId} not found.`);
  }
  return { message: "Car deleted successfully" };
};

const updateExistingCar = async (carId, carData, files) => {
  // 1. Chuẩn hóa ID xe
  const id = parseInt(carId);
  if (isNaN(id)) {
    throw new Error("Invalid Car ID.");
  }

  // 2. Lấy danh sách tên file ảnh mới (nếu có)
  // Nếu không có file mới, Multer sẽ trả về mảng rỗng.
  const imageFileNames = files.map((file) => file.filename);

  // 3. Chuẩn hóa serviceIds
  // Giả định carData.serviceIds là chuỗi các ID cách nhau bằng dấu phẩy
  const serviceIds = carData.serviceIds
    ? carData.serviceIds
        .split(",")
        .map((serviceId) => parseInt(serviceId.trim()))
        .filter((serviceId) => !isNaN(serviceId))
    : [];

  try {
    const updated = await carModel.updateCar(
      id,
      carData,
      imageFileNames,
      serviceIds
    );

    const carDetails = await carModel.getCarById(id);
    if (!carDetails) {
      // Mặc dù model đã trả về true, ta cần đảm bảo ID hợp lệ
      throw new Error(`Car with ID ${id} not found for update.`);
    }

    return { carId: id, message: "Car updated successfully" };
  } catch (error) {
    console.error(`Error updating car ID ${id}:`, error);
    throw new Error(`Could not update car ID ${id} due to a database error.`);
  }
};
module.exports = {
  createNewCar,
  getCarDetails,
  getCarList,
  deleteExistingCar,
  updateExistingCar,
};
