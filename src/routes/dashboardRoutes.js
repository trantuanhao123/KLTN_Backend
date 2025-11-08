// routes/dashboard.route.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");

router.use(authMiddleware);
router.use(requireAdmin);

router.get("/all", dashboardController.getFullDashboardStats);

// 1. Tổng doanh thu (theo tháng)
router.get("/revenue/monthly", dashboardController.getMonthlyRevenue);

// 2. Lượt thuê theo tuần
router.get("/rentals/weekly", dashboardController.getWeeklyRentalCount);

// 3. Lịch thuê gần đây (limit 3)
router.get("/rentals/recent", dashboardController.getRecentRentals);

// 4. Báo cáo sự cố gần đây (limit 3)
router.get("/incidents/recent", dashboardController.getRecentIncidents);

// 5. Doanh thu theo loại xe
router.get("/revenue/by-category", dashboardController.getRevenueByCategory);

// 6. Xe được thuê nhiều nhất
router.get("/cars/most-rented", dashboardController.getMostRentedCars);

module.exports = router;
