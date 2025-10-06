const express = require("express");
const router = express.Router();
const CategoryController = require("../controllers/categoryController");

router.post("/", CategoryController.create);
router.get("/", CategoryController.getAll);
router.get("/:id", CategoryController.getById);
router.put("/:id", CategoryController.update);
router.delete("/:id", CategoryController.remove);

module.exports = router;
