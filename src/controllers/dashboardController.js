// controllers/dashboard.controller.js
const dashboardService = require("../services/dashboardService");

/**
 * Controller cho endpoint tổng hợp
 */
const getFullDashboardStats = async (req, res) => {
  try {
    const data = await dashboardService.getFullDashboard();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Controller cho các endpoint riêng lẻ (nếu bạn cần)
 */
const getMonthlyRevenue = async (req, res) => {
  try {
    const data = await dashboardService.getMonthlyRevenue();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getWeeklyRentalCount = async (req, res) => {
  try {
    const data = await dashboardService.getWeeklyRentalCount();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecentRentals = async (req, res) => {
  try {
    const data = await dashboardService.getRecentRentals();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecentIncidents = async (req, res) => {
  try {
    const data = await dashboardService.getRecentIncidents();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRevenueByCategory = async (req, res) => {
  try {
    const data = await dashboardService.getRevenueByCategory();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMostRentedCars = async (req, res) => {
  try {
    const data = await dashboardService.getMostRentedCars();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getFullDashboardStats,
  getMonthlyRevenue,
  getWeeklyRentalCount,
  getRecentRentals,
  getRecentIncidents,
  getRevenueByCategory,
  getMostRentedCars,
};
