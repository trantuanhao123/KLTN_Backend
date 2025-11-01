const express = require("express");
const router = express.Router();
const CategoryController = require("../controllers/categoryController");
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");
router.post("/", authMiddleware, requireAdmin, CategoryController.create);
router.get("/", authMiddleware, CategoryController.getAll);
router.get("/:id", authMiddleware, CategoryController.getById);
router.put("/:id", authMiddleware, requireAdmin, CategoryController.update);
router.delete("/:id", authMiddleware, requireAdmin, CategoryController.remove);

module.exports = router;
