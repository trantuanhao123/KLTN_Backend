# Vehicle Rental Management System – Backend

## 👤 Author
**Tran Tuan Hao (Trần Tuấn Hào)**  
Backend Developer  
GitHub: https://github.com/trantuanhao123

---

## 📌 Project Overview

This repository contains the **backend system** for a **Vehicle Rental Management System**, built with **Node.js, Express, and MySQL**.

The backend exposes **RESTful APIs** to support:
- A **React-based Admin Dashboard**
- Client applications (web/mobile)

The project focuses on **backend system design**, **business logic processing**, **secure authentication**, and **payment integration**.

---

## 🚀 Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based authorization (Admin / Staff / Customer)
- Google OAuth 2.0 login
- OTP-based email verification for:
  - User registration
  - Password reset
- Secure password hashing using bcrypt

---

### 🚗 Vehicle & Rental Management
- Vehicle, category, branch, and service management
- Rental booking workflow with status lifecycle:
  - `pending`
  - `confirmed`
  - `renting`
  - `returned`
  - `canceled`
- Centralized business rules for rental processing

---

### 💰 Pricing & Promotions
- Dynamic rental price calculation based on:
  - Rental duration
  - Vehicle type
  - Applied discounts and promotions

---

### 💳 Payment Integration
- Integrated **PayOS** payment gateway
- Handle online rental payments
- Validate and process payment transactions

---

### 📊 Additional Modules
- Banner & notification management
- Review and incident reporting
- Image upload handling using Multer
- Scheduled background jobs using node-cron

---

## 🧠 Backend Architecture

The backend follows a **modular MVC-inspired architecture**, with clear separation of concerns:

src/
├── config/ # Database, mail, payment, upload configuration
├── controllers/ # Handle HTTP requests & responses
├── services/ # Business logic layer
├── models/ # Data access layer (Raw SQL using mysql2)
├── middlewares/ # Authentication, authorization, validation
├── routes/ # API route definitions
├── public/ # Static files (images, css)
├── views/ # EJS views (basic server-rendered pages)
└── server.js # Application entry point

---

## 🛡️ Best Practices Applied

- JWT authentication middleware
- Role-based access control
- Input validation using Joi
- Centralized request validation
- Secure handling of sensitive data
- Modular and maintainable code structure
- Consistent error handling strategy

---

## 🧪 API Testing

- APIs are tested using **Postman**

---

## 🛠️ Technologies Used

- Node.js
- Express.js
- MySQL
- mysql2 (Raw SQL queries)
- JWT
- Google OAuth 2.0
- PayOS
- Nodemailer
- bcrypt
- Multer
- Joi
- node-cron

---

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example` and configure the following variables:

```env
NODE_ENV=
PORT=
HOST_NAME=

# Database
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=

# Mail
MAILER_USER=
MAILER_PASSWORD=
MAIL_SENDER=
BREVO_API_KEY=

# Payment
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_API_HOST=
RESULT_URL=

# OAuth
GOOGLE_CLIENT_ID=

# Others
CRON_SECRET=
FRONTEND_URL=
```
---

## ▶️ Run the Project

```bash
npm install
npm run dev



