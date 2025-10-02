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

async function profile(req, res) {
  try {
    const user = req.user;
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  register,
  login,
  profile,
};
