// routes/branch.routes.js
const express = require("express");
const router = express.Router();
const BranchController = require("../controllers/branchController");
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");
// CRUD routes
router.post("/", authMiddleware, requireAdmin, BranchController.createBranch);
router.get("/", authMiddleware, BranchController.getAllBranches);
router.get("/:id", authMiddleware, BranchController.getBranchById);
router.put("/:id", authMiddleware, requireAdmin, BranchController.updateBranch);
router.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  BranchController.deleteBranch
);

module.exports = router;
