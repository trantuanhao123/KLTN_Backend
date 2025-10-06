const CategoryService = require("../services/categoryService");

// CREATE
async function create(req, res) {
  try {
    const result = await CategoryService.createCategory(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create category" });
  }
}

// READ ALL
async function getAll(req, res) {
  try {
    const data = await CategoryService.getAllCategories();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
}

// READ ONE
async function getById(req, res) {
  try {
    const category = await CategoryService.getCategoryById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch category" });
  }
}

// UPDATE
async function update(req, res) {
  try {
    const result = await CategoryService.updateCategory(
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update category" });
  }
}

// DELETE
async function remove(req, res) {
  try {
    const result = await CategoryService.deleteCategory(req.params.id);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete category" });
  }
}

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
};
