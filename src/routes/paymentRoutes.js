const express = require("express");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

// Bước 3, TH1: Endpoint nhận Webhook từ PayOS
router.post("/webhook/payos", paymentController.handlePayOSWebhook);

module.exports = router;
