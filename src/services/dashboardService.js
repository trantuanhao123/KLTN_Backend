// services/dashboard.service.js
const dashboardModel = require("../models/dashboard");

/**
 * Lấy tất cả thống kê cho Dashboard chính
 * (Dùng Promise.all để chạy song song các query)
 */
const getFullDashboard = async () => {
  try {
    const [
      stats,
      monthlyRevenue,
      weeklyRentals,
      recentRentals,
      recentIncidents,
      revenueByCategory,
      mostRentedCars,
    ] = await Promise.all([
      dashboardModel.getDashboardStats(),
      dashboardModel.getMonthlyRevenue(),
      dashboardModel.getWeeklyRentalCount(),
      dashboardModel.getRecentRentals(3),
      dashboardModel.getRecentIncidents(3),
      dashboardModel.getRevenueByCategory(),
      dashboardModel.getMostRentedCars(5),
    ]);

    return {
      stats, // { totalRevenue, totalRentals, ... }
      monthlyRevenue, // [ { month: '2025-11', totalRevenue: 5000 } ]
      weeklyRentals, // [ { year: 2025, week: 45, rentalCount: 10 } ]
      recentRentals, // [ { ORDER_ID, ... } ] (limit 3)
      recentIncidents, // [ { INCIDENT_ID, ... } ] (limit 3)
      revenueByCategory, // [ { categoryName: 'SUV', totalRevenue: 1000 } ]
      mostRentedCars, // [ { CAR_ID, ... } ] (limit 5)
    };
  } catch (error) {
    console.error("Error getting full dashboard stats:", error);
    throw new Error("Could not retrieve dashboard statistics.");
  }
};

// Bạn cũng có thể export các hàm riêng lẻ nếu cần
const getMonthlyRevenue = () => dashboardModel.getMonthlyRevenue();
const getWeeklyRentalCount = () => dashboardModel.getWeeklyRentalCount();
const getRecentRentals = () => dashboardModel.getRecentRentals(3);
const getRecentIncidents = () => dashboardModel.getRecentIncidents(3);
const getRevenueByCategory = () => dashboardModel.getRevenueByCategory();
const getMostRentedCars = () => dashboardModel.getMostRentedCars(5);

module.exports = {
  getFullDashboard,
  // export riêng lẻ
  getMonthlyRevenue,
  getWeeklyRentalCount,
  getRecentRentals,
  getRecentIncidents,
  getRevenueByCategory,
  getMostRentedCars,
};
