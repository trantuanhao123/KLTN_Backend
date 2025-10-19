// controllers/payosController.js
const PayOSService = require("../services/payosService");

async function createPayment(req, res) {
  try {
    const paymentLink = await PayOSService.createPayment(req.body);
    res.json({ url: paymentLink });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Tạo link thanh toán thất bại" });
  }
}

async function webhook(req, res) {
  try {
    const result = await PayOSService.handleWebhook(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Xử lý webhook thất bại" });
  }
}

module.exports = { createPayment, webhook };
