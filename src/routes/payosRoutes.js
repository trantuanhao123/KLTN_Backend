const express = require("express");
const router = express.Router();
const { createPayment, webhook } = require("../controllers/payosController");

router.post("/create-payment", createPayment);
router.post("/webhook", webhook);
module.exports = router;
