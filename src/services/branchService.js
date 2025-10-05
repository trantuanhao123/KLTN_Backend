// services/branch.service.js
const BranchModel = require("../models/branch");

async function createBranch(data) {
  return await BranchModel.createBranch(data);
}

async function getAllBranches() {
  return await BranchModel.getAllBranches();
}

async function getBranchById(branchId) {
  return await BranchModel.getBranchById(branchId);
}

async function updateBranch(branchId, data) {
  return await BranchModel.updateBranch(branchId, data);
}

async function deleteBranch(branchId) {
  return await BranchModel.deleteBranch(branchId);
}

module.exports = {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};
