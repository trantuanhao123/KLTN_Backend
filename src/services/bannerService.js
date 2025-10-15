const bannerModel = require("../models/banner");

async function createBanner(data) {
  return await bannerModel.createBanner(data);
}

async function getAllBanners() {
  return await bannerModel.getAllBanners();
}

async function getBannerById(id) {
  const banner = await bannerModel.getBannerById(id);
  if (!banner) throw new Error("Không tìm thấy banner!");
  return banner;
}

async function updateBanner(id, data) {
  return await bannerModel.updateBanner(id, data);
}

async function deleteBanner(id) {
  return await bannerModel.deleteBanner(id);
}

module.exports = {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};
