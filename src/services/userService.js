const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user");

async function register({ email, phone, password, fullname }) {
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) throw new Error("Email already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await UserModel.create({
    email,
    phone,
    passwordHash,
    fullname,
  });

  return { userId, email };
}

async function login({ email, password }) {
  const user = await UserModel.findByEmail(email);
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.PASSWORD_HASH);
  if (!valid) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { userId: user.USER_ID, role: user.ROLE },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "1h" }
  );

  return { token, user };
}

module.exports = {
  register,
  login,
};
