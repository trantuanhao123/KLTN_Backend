require("dotenv").config();
const express = require("express");
const configViewEngine = require("./config/viewengine");
const cron = require("node-cron");
const { checkConnection } = require("./config/database");

const rentalOrderService = require("./services/rentalOrderService");
const webRouter = require("./routes/web");
const userRouter = require("./routes/userRoutes");
const otpRouter = require("./routes/otpRoutes");
const carRouter = require("./routes/carRoutes");
const serviceRouter = require("./routes/serviceRoutes");
const branchRouter = require("./routes/branchRoutes");
const categoryRouter = require("./routes/categoryRoutes");
const carImageRouter = require("./routes/carImageRoutes");
const bannerRouter = require("./routes/bannerRoutes");
const rentalOrderRouter = require("./routes/rentalOrderRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const discountRouter = require("./routes/discountRoutes");
const notificationRouter = require("./routes/notificationRoutes");

const app = express(); //app express
const port = process.env.PORT || 8080; //port
const hostname = process.env.HOST_NAME;
const cors = require("cors");

//Thiết lập cors để các client ngoài domain có thể truy cập
app.use(cors());
//config req.body
app.use(express.json()); //for json
app.use(express.urlencoded({ extended: true })); //for form data
//config template engine
configViewEngine(app);

//khai bao route
app.use("/", webRouter);
app.use("/user", userRouter);
app.use("/auth", otpRouter);
app.use("/car", carRouter);
app.use("/service", serviceRouter);
app.use("/branch", branchRouter);
app.use("/category", categoryRouter);
app.use("/car-image", carImageRouter);
app.use("/banner", bannerRouter);
app.use("/order", rentalOrderRouter);
app.use("/payment", paymentRouter);
app.use("/discount", discountRouter);
app.use("/notification", notificationRouter);

console.log("⏰ Đã lên lịch cho Cron Job (quét đơn hết hạn) chạy mỗi phút.");

cron.schedule("* * * * *", async () => {
  console.log("CRON: ⏰ Bắt đầu chạy tác vụ quét đơn hàng hết hạn...");
  try {
    // Gọi thẳng hàm service, không cần gọi qua API
    await rentalOrderService.processExpiredOrders();
    console.log("CRON: ✅ Tác vụ quét đơn đã hoàn tất.");
  } catch (err) {
    console.error("CRON: ❌ Lỗi khi đang chạy tác vụ quét đơn:", err.message);
  }
});
// Hàm chính khởi động Server
async function startServer() {
  try {
    await checkConnection();
    app.listen(port, hostname, () => {
      console.log(`🚀 Server is running successfully!`);
      console.log(`📡 Access URL: http://${hostname}:${port}`);
    });
  } catch (error) {
    console.error("⚠️ Khởi động thất bại. Server KHÔNG được bật do lỗi:");
    process.exit(1);
  }
}
startServer();
