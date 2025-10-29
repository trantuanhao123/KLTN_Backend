// routes/incident.routes.js
const express = require("express");
const router = express.Router();
const IncidentController = require("../controllers/incidentController");

const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");

// (Giả sử) Middleware upload
const { uploadIncidentMedia } = require("../config/multer");

// --- User Routes ---

// POST /api/incidents
// (User) Tạo sự cố mới (kèm media)
router.post(
  "/",
  authMiddleware,
  uploadIncidentMedia,
  IncidentController.handleCreateIncident
);

// PUT /api/incidents/:id
// (User) Cập nhật mô tả sự cố
router.put("/:id", authMiddleware, IncidentController.handleUpdateIncident);

// DELETE /api/incidents/:id
// (User/Admin) Xóa sự cố
router.delete("/:id", authMiddleware, IncidentController.handleDeleteIncident);

// --- Admin Routes ---

// GET /api/incidents
// (Admin) Lấy danh sách tất cả sự cố
router.get(
  "/",
  authMiddleware,
  requireAdmin,
  IncidentController.handleGetAllIncidents
);

// GET /api/incidents/:id
// (Admin + User) Lấy chi tiết 1 sự cố
router.get("/:id", authMiddleware, IncidentController.handleGetIncidentById);

// PATCH /api/incidents/:id/status
// (Admin) Cập nhật trạng thái sự cố
router.patch(
  "/status/:id",
  authMiddleware,
  requireAdmin,
  IncidentController.handleUpdateStatus
);

module.exports = router;
