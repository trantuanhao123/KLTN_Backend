// routes/branch.routes.js
const express = require("express");
const router = express.Router();
const BranchController = require("../controllers/branchController");

// CRUD routes
router.post("/", BranchController.createBranch);
router.get("/", BranchController.getAllBranches);
router.get("/:id", BranchController.getBranchById);
router.put("/:id", BranchController.updateBranch);
router.delete("/:id", BranchController.deleteBranch);

module.exports = router;
