// controllers/incident.controller.js
const IncidentService = require("../services/incidentService");

// (User) Tạo sự cố
const handleCreateIncident = async (req, res) => {
  try {
    const incidentData = req.body;
    const files = req.files;
    const userId = req.user.USER_ID; // 👈 SỬA Ở ĐÂY

    const result = await IncidentService.createIncident(
      incidentData,
      files,
      userId
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// (User) Cập nhật mô tả
const handleUpdateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const userId = req.user.USER_ID; // 👈 SỬA Ở ĐÂY

    const result = await IncidentService.updateIncidentDescription(
      id,
      description,
      userId
    );
    res.status(200).json(result);
  } catch (error) {
    if (
      error.message.includes("không có quyền") ||
      error.message.includes("không thể chỉnh sửa")
    ) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes("Không tìm thấy")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

// (Admin) Cập nhật trạng thái
const handleUpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
      return res.status(400).json({ error: "Trạng thái không hợp lệ." });
    }

    const result = await IncidentService.updateIncidentStatus(id, status);
    res.status(200).json(result);
  } catch (error) {
    if (error.message.includes("Không tìm thấy")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// (User/Admin) Xóa sự cố
const handleDeleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user; // 👈 Chỗ này vẫn giữ nguyên (vì service sẽ xử lý)

    const result = await IncidentService.deleteIncident(id, user);
    res.status(200).json(result);
  } catch (error) {
    if (error.message.includes("không có quyền")) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes("Không tìm thấy")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// (Admin) Lấy danh sách
const handleGetAllIncidents = async (req, res) => {
  try {
    const incidents = await IncidentService.getAllIncidents();
    res.status(200).json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// (Admin) Lấy chi tiết
const handleGetIncidentById = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await IncidentService.getIncidentById(id);
    res.status(200).json(incident);
  } catch (error) {
    if (error.message.includes("Không tìm thấy")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  handleCreateIncident,
  handleUpdateIncident,
  handleUpdateStatus,
  handleDeleteIncident,
  handleGetAllIncidents,
  handleGetIncidentById,
};
