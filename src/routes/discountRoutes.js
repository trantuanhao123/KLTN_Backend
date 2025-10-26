// src/routes/discountRoutes.js
const express = require("express");
const router = express.Router();
const discountController = require("../controllers/discountController");
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");

// 🟢 CHECK MÃ GIẢM GIÁ (đặt trước /:id để tránh xung đột)
router.post(
  "/check",
  authMiddleware,
  discountController.checkDiscountCodeHandler
);

// 🟩 CRUD
router.post(
  "/",
  authMiddleware,
  requireAdmin,
  discountController.createDiscountHandler
);

router.get(
  "/",
  authMiddleware,
  requireAdmin,
  discountController.getAllDiscountsHandler
);

router.get(
  "/:id",
  authMiddleware,
  requireAdmin,
  discountController.getDiscountByIdHandler
);

router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  discountController.updateDiscountHandler
);

router.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  discountController.deleteDiscountHandler
);

module.exports = router;
