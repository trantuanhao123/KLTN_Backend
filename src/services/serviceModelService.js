// services/serviceService.js
const ServiceModel = require("../models/serviceModel");

async function getAllServices() {
  return await ServiceModel.getAllServices();
}

async function getServiceById(serviceId) {
  if (!serviceId) throw new Error("Thiếu SERVICE_ID");
  return await ServiceModel.getServiceById(serviceId);
}

async function createService({ name, description }) {
  if (!name) throw new Error("Thiếu NAME");
  return await ServiceModel.createService(name, description);
}

async function updateService(serviceId, { name, description }) {
  if (!serviceId) throw new Error("Thiếu SERVICE_ID để cập nhật");
  if (!name) throw new Error("Thiếu NAME");
  return await ServiceModel.updateService(serviceId, name, description);
}

async function deleteService(serviceId) {
  if (!serviceId) throw new Error("Thiếu SERVICE_ID để xóa");
  return await ServiceModel.deleteService(serviceId);
}

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
