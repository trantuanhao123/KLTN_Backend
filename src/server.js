require("dotenv").config();
const express = require("express"); //common js
const configViewEngine = require("./config/viewengine");

const { checkConnection } = require("./config/database");

const webRouter = require("./routes/web");
const userRouter = require("./routes/userRoutes");
const otpRouter = require("./routes/otpRoutes");

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
