const carModel = require("../models/car");

const createNewCar = async (carData, files) => {
  const imageFileNames = files.map((file) => file.filename);

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

const updateExistingCar = async (carId, carData) => {
  const id = parseInt(carId);
  if (isNaN(id)) throw new Error("Invalid Car ID.");

  // 1️⃣ Chuẩn hóa danh sách dịch vụ
  const serviceIds = carData.serviceIds
    ? carData.serviceIds
        .split(",")
        .map((sid) => parseInt(sid.trim()))
        .filter((sid) => !isNaN(sid))
    : [];

  try {
    const updated = await carModel.updateCar(id, carData, serviceIds);
    if (!updated) throw new Error(`Car ID ${id} not found.`);

    return { carId: id, message: "Car updated successfully." };
  } catch (err) {
    console.error(`❌ Error updating car ID ${id}:`, err);
    throw new Error(`Could not update car ID ${id}: ${err.message}`);
  }
};
const getCarUser = async () => {
  // Chúng ta gọi hàm model cũ, nhưng truyền filter cứng
  // là { status: 'AVAILABLE' }.
  // Hàm model getAllCarsUser sẽ xử lý filter này
  // và BỎ QUA filter branchId (vì chúng ta không truyền)
  const filters = { status: "AVAILABLE" };
  return await carModel.getAllCarsUser(filters);
};

module.exports = {
  createNewCar,
  getCarDetails,
  getCarList,
  deleteExistingCar,
  updateExistingCar,
  getCarUser,
};
