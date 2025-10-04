require("dotenv").config();
const express = require("express"); //common js
const configViewEngine = require("./config/viewengine");
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
app.listen(port, hostname, () => {
  console.log(`App listening on port ${port}`);
});
