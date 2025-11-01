// routes/serviceRoutes.js
const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");
router.get("/", authMiddleware, serviceController.getAllServices);
router.get("/:id", authMiddleware, serviceController.getServiceById);
router.post("/", authMiddleware, requireAdmin, serviceController.createService);
router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  serviceController.updateService
);
router.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  serviceController.deleteService
);

module.exports = router;
