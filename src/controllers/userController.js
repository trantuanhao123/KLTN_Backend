const UserService = require("../services/userService");

async function register(req, res) {
  try {
    const { email, phone, password, fullname } = req.body;
    const result = await UserService.register({
      email,
      phone,
      password,
      fullname,
    });
    res.status(201).json({ message: "User registered successfully", result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await UserService.login({ email, password });
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}
async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;
    const adminInfo = await UserService.loginAdmin({
      email,
      password,
    });
    res.status(200).json({
      message: "Admin login successful",
      ...adminInfo,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}
async function profile(req, res) {
  try {
    const user = req.user;
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
async function getAllUsers(req, res) {
  try {
    const users = await UserService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const updated = await UserService.updateUser(id, req.body);
    res.json({ message: "Cập nhật thành công", user: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    await UserService.deleteUser(id);
    res.json({ message: "Xóa người dùng thành công" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
async function reActiveUser(req, res) {
  try {
    const { id } = req.params;
    await UserService.reActiveUser(id);
    res.json({ message: "Xóa người dùng thành công" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
async function verifyUser(req, res) {
  try {
    const { id } = req.params;
    const verifiedUser = await UserService.verifyUser(id);
    res.json({ message: "Xác minh người dùng thành công", user: verifiedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  register,
  login,
  loginAdmin,
  profile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  verifyUser,
  reActiveUser,
};
