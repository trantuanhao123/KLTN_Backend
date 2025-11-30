// const nodemailer = require("nodemailer");
// // Cấu hình transporter
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.MAILER_USER,
//     pass: process.env.MAILER_PASSWORD,
//   },
// });

// module.exports = transporter;
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,            
  secure: false,          
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false 
  },
  connectionTimeout: 10000, 
  greetingTimeout: 10000,   
  socketTimeout: 10000,     
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("Nodemailer Error:", error);
  } else {
    console.log("Server đã sẵn sàng gửi email (Port 587).");
  }
});

module.exports = transporter;