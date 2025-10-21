const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// 🟩 Thanh toán bằng tiền mặt
router.post("/cash", paymentController.createCashPayment);

// 🟨 Lấy thanh toán theo order id
router.get("/:orderId", paymentController.getPaymentByOrderId);

module.exports = router;
