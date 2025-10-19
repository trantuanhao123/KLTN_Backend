const express = require("express");
const router = express.Router();
const {
  handleCreateOrder,
  handleGetOrder,
  handleGetUserOrders,
  handleGetAllOrders,
  handleUpdateStatus,
  handleSetExtraFee,
  handleDeleteOrder,
} = require("../controllers/rentalOrderController");

// USER
router.post("/", handleCreateOrder);
router.get("/:order_id", handleGetOrder);
router.get("/user/:user_id", handleGetUserOrders);
router.delete("/:order_id", handleDeleteOrder);

// ADMIN
router.get("/", handleGetAllOrders);
router.patch("/status/:order_id", handleUpdateStatus);
router.post("/extra-fee/:order_id", handleSetExtraFee);

module.exports = router;
