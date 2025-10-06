const CategoryModel = require("../models/category");

async function createCategory(data) {
  return await CategoryModel.createCategory(data);
}

async function getAllCategories() {
  return await CategoryModel.getAllCategories();
}

async function getCategoryById(id) {
  return await CategoryModel.getCategoryById(id);
}

async function updateCategory(id, data) {
  return await CategoryModel.updateCategory(id, data);
}

async function deleteCategory(id) {
  return await CategoryModel.deleteCategory(id);
}

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
