// src/routes/carRoutes.js
const express = require("express");
const carController = require("../controllers/carController");
const { uploadCarImages } = require("../config/multer");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", uploadCarImages, carController.handleCreateCar);
// router.get("/", authMiddleware, carController.handleGetAllCars);
router.get("/", carController.handleGetAllCars);
router.get("/available", carController.handleGetCarUser);
router.get("/:id", carController.handleGetCarDetails);
router.put("/:id", carController.handleUpdateCar);
router.delete("/:id", carController.handleDeleteCar);

module.exports = router;
