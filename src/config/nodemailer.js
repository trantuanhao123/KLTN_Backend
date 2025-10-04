const nodemailer = require("nodemailer");
// Cấu hình transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASSWORD,
  },
});

// Cấu hình email
// const mailOptions = {
//   from:process.env.MAILER_USER,
//   to: "recipient-email@example.com",
//   subject: "Test Email",
//   text: "This is a test email sent using Nodemailer!",
// };

// // Gửi email
// transporter.sendMail(mailOptions, (error, info) => {
//   if (error) {
//     console.log("Error:", error);
//   } else {
//     console.log("Email sent:", info.response);
//   }
// });

module.exports = transporter;
