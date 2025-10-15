const fs = require("fs");
const path = require("path");
const bannerService = require("../services/bannerService");

const IMAGE_DIR = path.join(__dirname, "..", "public", "images");

// 🟢 CREATE
async function createBanner(req, res) {
  try {
    const { title, description, status } = req.body;
    const image_url = req.file ? `${req.file.filename}` : null;

    if (!image_url) throw new Error("Vui lòng tải lên hình banner!");

    const bannerData = { title, image_url, description, status };
    const result = await bannerService.createBanner(bannerData);

    res.json({
      message: "Tạo banner thành công!",
      banner_id: result.insertId,
      ...bannerData,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// 🟢 GET ALL
async function getAllBanners(req, res) {
  try {
    const banners = await bannerService.getAllBanners();
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 🟢 GET BY ID
async function getBannerById(req, res) {
  try {
    const { id } = req.params;
    const banner = await bannerService.getBannerById(id);
    res.json(banner);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

// 🟡 UPDATE (xử lý hình cũ)
async function updateBanner(req, res) {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    const existingBanner = await bannerService.getBannerById(id);

    if (!existingBanner) throw new Error("Không tìm thấy banner!");

    let image_url = existingBanner.IMAGE_URL;

    // Nếu upload hình mới → xóa hình cũ
    if (req.file) {
      image_url = `${req.file.filename}`;
      const oldImagePath = path.join(
        IMAGE_DIR,
        path.basename(existingBanner.IMAGE_URL)
      );
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }

    const result = await bannerService.updateBanner(id, {
      title,
      image_url,
      description,
      status,
    });

    res.json({ message: "Cập nhật banner thành công!", result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// 🔴 DELETE (xóa luôn hình vật lý)
async function deleteBanner(req, res) {
  try {
    const { id } = req.params;
    const banner = await bannerService.getBannerById(id);
    if (!banner) throw new Error("Không tìm thấy banner!");

    // Xóa file hình nếu tồn tại
    const imagePath = path.join(IMAGE_DIR, path.basename(banner.IMAGE_URL));
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    await bannerService.deleteBanner(id);

    res.json({ message: "Xóa banner thành công!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// 🟠 TOGGLE STATUS (ACTIVE / INACTIVE)
async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const banner = await bannerService.getBannerById(id);
    if (!banner) throw new Error("Không tìm thấy banner!");

    const newStatus = banner.STATUS === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await bannerService.updateBanner(id, {
      title: banner.TITLE,
      image_url: banner.IMAGE_URL,
      description: banner.DESCRIPTION,
      status: newStatus,
    });

    res.json({
      message: `Đã đổi trạng thái banner sang ${newStatus}`,
      status: newStatus,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  updateStatus,
};
