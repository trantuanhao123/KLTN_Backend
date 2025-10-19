const {
  createOrder,
  getOrder,
  getOrdersByUser,
  getAllOrders,
  changeOrderStatus,
  setExtraFeeForOrder,
  removeOrder,
} = require("../services/rentalOrderService");

// USER
async function handleCreateOrder(req, res) {
  try {
    const result = await createOrder(req.body);
    res.status(201).json({ message: "Tạo đơn thuê thành công", data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function handleGetOrder(req, res) {
  try {
    const order = await getOrder(req.params.order_id);
    res.json(order);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

async function handleGetUserOrders(req, res) {
  try {
    const orders = await getOrdersByUser(req.params.user_id);
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ADMIN
async function handleGetAllOrders(req, res) {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function handleUpdateStatus(req, res) {
  try {
    await changeOrderStatus(req.params.order_id, req.body.status);
    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ✅ Ghi đè phí phát sinh + cập nhật trạng thái + paid=false
async function handleSetExtraFee(req, res) {
  try {
    const { amount, reason } = req.body;
    await setExtraFeeForOrder(req.params.order_id, amount, reason);
    res.json({ message: "Đã cập nhật phí phát sinh" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function handleDeleteOrder(req, res) {
  try {
    await removeOrder(req.params.order_id);
    res.json({ message: "Đã xóa đơn thuê" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  handleCreateOrder,
  handleGetOrder,
  handleGetUserOrders,
  handleGetAllOrders,
  handleUpdateStatus,
  handleSetExtraFee,
  handleDeleteOrder,
};
