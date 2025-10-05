// controllers/serviceController.js
const ServiceService = require("../services/serviceModelService");

async function getAllServices(req, res) {
  try {
    const result = await ServiceService.getAllServices();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    const result = await ServiceService.getServiceById(id);
    if (!result)
      return res.status(404).json({ error: "Không tìm thấy dịch vụ" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createService(req, res) {
  try {
    const data = req.body;
    const result = await ServiceService.createService(data);
    res.status(201).json({ message: "Tạo dịch vụ thành công", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateService(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const result = await ServiceService.updateService(id, data);
    res.json({ message: "Cập nhật thành công", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteService(req, res) {
  try {
    const { id } = req.params;
    const result = await ServiceService.deleteService(id);
    res.json({ message: "Xóa dịch vụ thành công", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
