// src/routes/carRoutes.js
const express = require("express");
const carController = require("../controllers/carController");
const { uploadCarImages } = require("../config/multer");
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");
const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireAdmin,
  uploadCarImages,
  carController.handleCreateCar
);
// router.get("/", authMiddleware, carController.handleGetAllCars);
router.get("/", authMiddleware, carController.handleGetAllCars);
router.get("/available", authMiddleware, carController.handleGetCarUser);
router.get("/:id", authMiddleware, carController.handleGetCarDetails);
router.put("/:id", authMiddleware, requireAdmin, carController.handleUpdateCar);
router.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  carController.handleDeleteCar
);

module.exports = router;
