const UserService = require("../services/userService");
const fs = require("fs");
const path = require("path");

const IMAGE_DIR = path.join(__dirname, "..", "public", "images");

function deleteIfExists(filenameOrUrl) {
  if (!filenameOrUrl) return;
  let filename = filenameOrUrl;
  if (filenameOrUrl.includes("/images/")) {
    filename = filenameOrUrl.split("/images/")[1];
  }

  const filePath = path.join(IMAGE_DIR, filename);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return;
    }

    fs.unlink(filePath, (err) => {
      if (err) console.error("❌ Lỗi khi xóa file:", err.message);
    });
  });
}
async function register(req, res) {
  try {
    const { email, phone, password, fullname } = req.body;
    const result = await UserService.register({
      email,
      phone,
      password,
      fullname,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
async function verifyRegistration(req, res) {
  try {
    // 👈 Chỉ cần email và otp
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Vui lòng cung cấp email và OTP." });
    }

    const result = await UserService.verifyRegistration({ email, otp });

    // 👈 Trả về token và user
    res.json({ message: "Xác thực tài khoản thành công!", ...result });
  } catch (error) {
    // Xử lý lỗi nghiệp vụ
    if (error.message.includes("Email không tồn tại")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("OTP không hợp lệ")) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Lỗi Controller khi xác thực đăng ký:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi hệ thống." });
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

async function updateProfile(req, res) {
  try {
    const { id } = req.params;
    const profileData = req.body;

    const updatedUser = await UserService.updateUserProfile(id, profileData);

    res.json({ message: "Cập nhật thông tin thành công!", user: updatedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function uploadAvatar(req, res) {
  try {
    const { id } = req.params;

    if (!req.file) {
      throw new Error("Vui lòng tải lên một ảnh đại diện.");
    }

    const newAvatar = req.file.filename;

    // 🔍 Lấy thông tin user hiện tại
    const user = await UserService.getUserById(id);
    if (!user) throw new Error("Không tìm thấy người dùng.");

    // 🧹 Nếu user có avatar cũ thì xóa
    if (user.AVATAR_URL) {
      console.log("🧾 Avatar cũ:", user.AVATAR_URL);
      deleteIfExists(user.AVATAR_URL);
    }

    // 💾 Cập nhật DB với avatar mới
    const updatedUser = await UserService.updateUserAvatar(id, newAvatar);

    res.json({
      message: "Cập nhật ảnh đại diện thành công!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Lỗi uploadAvatar:", error);
    res.status(400).json({ error: error.message });
  }
}

async function uploadLicense(req, res) {
  try {
    const { id } = req.params;

    if (!req.files || !req.files.license_front || !req.files.license_back) {
      throw new Error(
        "Vui lòng tải lên đủ ảnh mặt trước và mặt sau của bằng lái."
      );
    }

    const newLicense = {
      frontUrl: req.files.license_front[0].filename,
      backUrl: req.files.license_back[0].filename,
    };

    // Lấy thông tin cũ để xóa ảnh cũ
    const user = await UserService.getUserById(id);
    if (user?.LICENSE_FRONT_URL) deleteIfExists(user.LICENSE_FRONT_URL);
    if (user?.LICENSE_BACK_URL) deleteIfExists(user.LICENSE_BACK_URL);

    const updatedUser = await UserService.updateUserLicense(id, newLicense);

    res.json({
      message: "Cập nhật bằng lái xe thành công!",
      user: updatedUser,
    });
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
async function unverifyUser(req, res) {
  try {
    const { id } = req.params;
    const unverifiedUser = await UserService.unverifyUser(id);
    res.json({
      message: "Hủy xác minh người dùng thành công",
      user: unverifiedUser,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
async function changePassword(req, res) {
  try {
    const userId = req.user.USER_ID; // Lấy từ JWT (authMiddleware)
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Vui lòng nhập đầy đủ mật khẩu cũ và mới." });
    }

    const result = await UserService.changePassword(
      userId,
      oldPassword,
      newPassword
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
module.exports = {
  register,
  verifyRegistration,
  login,
  loginAdmin,
  profile,
  getAllUsers,
  getUserById,
  updateProfile,
  uploadAvatar,
  uploadLicense,
  deleteUser,
  verifyUser,
  unverifyUser,
  reActiveUser,
  changePassword,
};
