// controllers/branch.controller.js
const BranchService = require("../services/branchService");

async function createBranch(req, res) {
  try {
    const result = await BranchService.createBranch(req.body);
    res.status(201).json({
      message: "Branch created successfully",
      branch_id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllBranches(req, res) {
  try {
    const branches = await BranchService.getAllBranches();
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getBranchById(req, res) {
  try {
    const branch = await BranchService.getBranchById(req.params.id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateBranch(req, res) {
  try {
    const result = await BranchService.updateBranch(req.params.id, req.body);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Branch not found" });
    res.json({ message: "Branch updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteBranch(req, res) {
  try {
    const result = await BranchService.deleteBranch(req.params.id);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Branch not found" });
    res.json({ message: "Branch deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};
