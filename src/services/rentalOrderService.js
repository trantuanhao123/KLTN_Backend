const { connection } = require("../config/database");
const rentalOrderModel = require("../models/rentalOrder");
const paymentModel = require("../models/payment");
const carModel = require("../models/car");
const discountModel = require("../models/discount");
const notificationModel = require("../models/notification");
const payos = require("../config/payos");
const { v4: uuidv4 } = require("uuid");

/**
 * Tính toán giá thuê (Logic giả định)
 * Bạn cần thay thế bằng logic tính giá thực tế
 */
const calculatePrice = (car, startDate, endDate, rentalType) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // --- 1. Kiểm tra tính hợp lệ của ngày ---
  // isNaN(start.getTime()) sẽ đúng nếu new Date(startDate) là "Invalid Date"
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error("Lỗi calculatePrice: Ngày tháng không hợp lệ.");
    return 0; // Trả về 0 để tránh lỗi 'undefined'
  }

  // --- 2. Tính toán thời lượng (tính bằng giờ) ---
  // (1000 * 60 * 60) = mili-giây * giây * phút
  const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  // Nếu ngày kết thúc trước ngày bắt đầu, trả về 0
  if (totalHours <= 0) {
    console.error("Lỗi calculatePrice: Ngày kết thúc phải sau ngày bắt đầu.");
    return 0;
  }

  // --- 3. Tính giá dựa trên hình thức thuê ---
  if (rentalType === "hour") {
    const pricePerHour = parseFloat(car.PRICE_PER_HOUR);

    // Kiểm tra giá có hợp lệ không
    if (isNaN(pricePerHour) || pricePerHour < 0) {
      console.error(
        `Lỗi calculatePrice: PRICE_PER_HOUR không hợp lệ cho xe ${car.CAR_ID}`
      );
      return 0;
    }

    // Làm tròn đến đơn vị tiền tệ nhỏ nhất (ví dụ: đồng)
    return Math.round(totalHours * pricePerHour);
  }

  // --- 4. Mặc định là thuê theo ngày ('day') ---
  const pricePerDay = parseFloat(car.PRICE_PER_DAY);

  if (isNaN(pricePerDay) || pricePerDay < 0) {
    console.error(
      `Lỗi calculatePrice: PRICE_PER_DAY không hợp lệ cho xe ${car.CAR_ID}`
    );
    return 0;
  }

  // Math.ceil: Làm tròn LÊN.
  // Ví dụ: 1.1 giờ -> 24 giờ (1 ngày)
  // 25 giờ -> 48 giờ (2 ngày)
  const totalDays = Math.ceil(totalHours / 24);

  // Đảm bảo ít nhất 1 ngày được tính
  const chargedDays = Math.max(totalDays, 1);

  return Math.round(chargedDays * pricePerDay);
};

/**
 * Bước 2: Khởi tạo đơn hàng (Ấn Đặt Xe)
 */
const createOrder = async (
  userId,
  carId,
  startDate,
  endDate,
  rentalType,
  paymentOption,
  discountCode
) => {
  let conn;
  try {
    // 1. Lấy thông tin xe và kiểm tra
    const car = await carModel.getCarById(carId);
    if (!car) throw new Error("Không tìm thấy xe.");
    if (car.STATUS !== "AVAILABLE") throw new Error("Xe không khả dụng.");

    // 2. Tính toán giá
    const rentalPrice = calculatePrice(car, startDate, endDate, rentalType);
    const totalAmount = rentalPrice; // Giá gốc

    // ✅ SỬA LỖI Ở ĐÂY
    let finalAmount = totalAmount; // Giá cuối cùng (phải là "let")

    let discountId = null;

    // 3. Khởi tạo Transaction
    conn = await connection.getConnection();
    await conn.beginTransaction();

    //Xử lý mã giảm giá
    if (discountCode) {
      // Tìm mã hợp lệ (trong transaction để lock)
      const discount = await discountModel.findValidCode(discountCode, conn);

      if (!discount) {
        throw new Error("Mã giảm giá không hợp lệ hoặc đã hết hạn/hết lượt.");
      }

      // Tính toán giá trị giảm
      let discountValue = 0;
      if (discount.TYPE === "PERCENT") {
        discountValue = totalAmount * (parseFloat(discount.VALUE) / 100);
      } else {
        // 'AMOUNT'
        discountValue = parseFloat(discount.VALUE);
      }

      // Cập nhật giá cuối cùng
      finalAmount = totalAmount - discountValue;
      // Đảm bảo giá không âm
      finalAmount = Math.max(0, finalAmount);

      discountId = discount.DISCOUNT_ID;

      // Cập nhật số lượng đã dùng
      await discountModel.incrementUsedCount(discountId, conn);
    }
    // 4. Tạo dữ liệu đơn hàng
    const orderCode = uuidv4(); // Tạo mã đơn hàng duy nhất
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    const orderData = {
      orderCode,
      userId,
      carId,
      startDate,
      endDate,
      rentalPrice, // Giá gốc chưa giảm
      totalAmount, // Giá gốc chưa giảm
      finalAmount, // Giá đã giảm
      expiresAt,
      discountId, // ID của mã giảm giá (hoặc null)
    };

    // 5. DB Update (trong transaction)
    // 5.1. INSERT INTO RENTAL_ORDER
    const { orderId } = await rentalOrderModel.create(orderData, conn);

    // 5.2. UPDATE CAR STATUS = 'RESERVED'
    await carModel.updateCarStatus(carId, "RESERVED", conn);

    // 6. Tạo link thanh toán PayOS
    let amountToPay = finalAmount; // Mặc định là trả 100%
    let description = `Thanh toan thue xe`;

    if (paymentOption === "deposit") {
      amountToPay = finalAmount * 0.1; // Chỉ cọc 10%
      description = `Dat coc 10% thue xe `;
    }
    amountToPay = Math.round(amountToPay);
    const payosOrder = {
      orderCode: orderId,
      amount: amountToPay,
      description: description,
      cancelUrl: `${process.env.FRONTEND_URL}/cancel`,
      returnUrl: `${process.env.FRONTEND_URL}/result`,
      signature: undefined,
    };

    const paymentLink = await payos.paymentRequests.create(payosOrder);

    // 7. Commit
    await conn.commit();

    return paymentLink;
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Lỗi khi tạo đơn hàng (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống khi tạo đơn hàng.");
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Bước 3, TH3: User tự hủy khi chưa thanh toán
 */
const cancelPendingOrder = async (userId, orderId) => {
  let conn;
  try {
    conn = await connection.getConnection();

    const order = await rentalOrderModel.findById(orderId, conn);
    if (!order) throw new Error("Không tìm thấy đơn hàng.");

    // Chỉ user mới được hủy đơn của mình
    if (order.USER_ID !== userId) throw new Error("Không có quyền truy cập.");

    // Chỉ hủy được đơn PENDING_PAYMENT
    if (order.STATUS !== "PENDING_PAYMENT") {
      throw new Error("Không thể hủy đơn ở trạng thái này.");
    }

    await conn.beginTransaction();

    // 1. UPDATE RENTAL_ORDER
    await rentalOrderModel.update(orderId, { STATUS: "CANCELLED" }, conn);

    // 2. UPDATE CAR
    await carModel.updateCarStatus(order.CAR_ID, "AVAILABLE", conn);

    await conn.commit();
    return { message: "Hủy đơn hàng thành công." };
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Lỗi khi hủy đơn PENDING (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Bước 3, TH2: Hệ thống (Cron Job) xử lý đơn hết hạn
 * (Hàm này sẽ được gọi bởi một Cron Job)
 */
const processExpiredOrders = async () => {
  let conn;
  console.log("CRON: Đang quét đơn hàng hết hạn...");
  try {
    conn = await connection.getConnection();
    const expiredOrders = await rentalOrderModel.findExpiredPendingOrders(conn);

    if (expiredOrders.length === 0) {
      console.log("CRON: Không có đơn nào hết hạn.");
      return;
    }

    console.log(
      `CRON: Phát hiện ${expiredOrders.length} đơn hết hạn. Đang xử lý...`
    );

    // Xử lý từng đơn trong một transaction riêng lẻ
    for (const order of expiredOrders) {
      let orderConn;
      try {
        orderConn = await connection.getConnection();
        await orderConn.beginTransaction();

        // 1. UPDATE RENTAL_ORDER
        await rentalOrderModel.update(
          order.ORDER_ID,
          { STATUS: "CANCELLED" },
          orderConn
        );

        // 2. UPDATE CAR
        await carModel.updateCarStatus(order.CAR_ID, "AVAILABLE", orderConn);

        await orderConn.commit();
        console.log(`CRON: Đã hủy đơn ${order.ORDER_ID}`);
      } catch (err) {
        if (orderConn) await orderConn.rollback();
        console.error(
          `CRON: Lỗi khi xử lý đơn ${order.ORDER_ID}:`,
          err.message
        );
      } finally {
        if (orderConn) orderConn.release();
      }
    }
  } catch (error) {
    // Lỗi khi lấy danh sách đơn (findExpiredPendingOrders)
    console.error("CRON: Lỗi nghiêm trọng khi quét đơn:", error);
  } finally {
    if (conn) conn.release(); // Release kết nối chính
  }
};

/**
 * Bước 4: Admin xác nhận nhận xe (bàn giao)
 */
const confirmOrderPickup = async (orderId, adminId, cashPaymentData) => {
  let conn;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    const order = await rentalOrderModel.findById(orderId, conn);
    if (!order) throw new Error("Không tìm thấy đơn hàng.");

    if (order.STATUS !== "CONFIRMED") {
      throw new Error("Đơn hàng không ở trạng thái 'CONFIRMED' để bàn giao.");
    }

    const updates = {
      STATUS: "IN_PROGRESS", // Cập nhật chung
    };

    // TH1: Đơn cọc (PARTIAL), Admin thu tiền mặt
    if (order.PAYMENT_STATUS === "PARTIAL") {
      if (!cashPaymentData || !cashPaymentData.amount) {
        throw new Error("Cần nhập số tiền mặt đã thu (90% còn lại).");
      }

      // 1. INSERT INTO PAYMENT (thu tiền mặt)
      await paymentModel.create(
        {
          orderId: orderId,
          amount: cashPaymentData.amount, // Số tiền admin nhập
          paymentType: "FINAL_PAYMENT",
          method: "CASH",
          status: "SUCCESS",
          transactionCode: `CASH_${orderId}_${adminId}`,
        },
        conn
      );

      // 2. UPDATE RENTAL_ORDER
      updates.PAYMENT_STATUS = "PAID";
    }
    // TH2: Đã PAID (trả 100%), bỏ qua

    // Cập nhật chung
    await rentalOrderModel.update(orderId, updates, conn);

    // Cập nhật xe
    await carModel.updateCarStatus(order.CAR_ID, "RENTED", conn);

    await conn.commit();
    return { message: "Xác nhận bàn giao xe thành công." };
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Lỗi khi xác nhận bàn giao (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Bước 5: Trả xe và xử lý phát sinh
 */
const completeOrder = async (
  orderId,
  adminId,
  extraFee,
  note,
  carReturnStatus = "AVAILABLE"
) => {
  let conn;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    const order = await rentalOrderModel.findById(orderId, conn);
    if (!order) throw new Error("Không tìm thấy đơn hàng.");
    if (order.STATUS !== "IN_PROGRESS") {
      throw new Error("Đơn hàng không ở trạng thái 'IN_PROGRESS'.");
    }

    const orderUpdates = {
      STATUS: "COMPLETED",
    };

    // Nếu có chi phí phát sinh (CPPS)
    const fee = parseFloat(extraFee);
    if (fee > 0) {
      // 1. Cập nhật RENTAL_ORDER
      orderUpdates.EXTRA_FEE = fee;
      orderUpdates.NOTE = note || "Chi phí phát sinh khi trả xe.";

      // 2. INSERT INTO PAYMENT (thu tiền mặt CPPS)
      await paymentModel.create(
        {
          orderId: orderId,
          amount: fee,
          paymentType: "EXTRA_FEE",
          method: "CASH",
          status: "SUCCESS",
          transactionCode: `EXTRA_${orderId}_${adminId}`,
        },
        conn
      );
    }

    // Cập nhật chung (Hoàn tất đơn)
    await rentalOrderModel.update(orderId, orderUpdates, conn);

    // Cập nhật xe
    await carModel.updateCarStatus(order.CAR_ID, carReturnStatus, conn);

    await conn.commit();
    return { message: "Hoàn tất đơn hàng thành công." };
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Lỗi khi hoàn tất đơn (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Bước 6: Hủy đơn (Khi đã STATUS = 'CONFIRMED')
 */
const cancelDepositedOrder = async (userId, orderId) => {
  let conn;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    const order = await rentalOrderModel.findById(orderId, conn);
    if (!order) throw new Error("Không tìm thấy đơn hàng.");
    if (order.USER_ID !== userId) throw new Error("Không có quyền truy cập.");
    if (order.STATUS !== "CONFIRMED") {
      throw new Error("Chỉ hủy được đơn đã 'CONFIRMED'.");
    }

    // Chỉ xử lý đơn cọc
    if (order.PAYMENT_STATUS !== "PARTIAL") {
      throw new Error("Chức năng này chỉ dùng để hủy đơn đã đặt cọc.");
    }

    const totalPaid = await paymentModel.getTotalPaidByOrderId(orderId, conn);
    const orderUpdates = {
      STATUS: "CANCELLED",
      EXTRA_FEE: totalPaid, // Phí hủy = tiền cọc
      NOTE: "Hủy khi đã cọc. Áp dụng chính sách mất cọc.",
    };

    // 1. Cập nhật RENTAL_ORDER
    await rentalOrderModel.update(orderId, orderUpdates, conn);

    // 2. Cập nhật CAR
    await carModel.updateCarStatus(order.CAR_ID, "AVAILABLE", conn);

    // 3. (MỚI) Tạo thông báo cho user
    await notificationModel.create(
      {
        USER_ID: order.USER_ID,
        TITLE: `Đơn hàng ${order.ORDER_CODE} đã bị hủy (mất cọc)`,
        CONTENT: `Bạn đã hủy đơn hàng ${order.ORDER_CODE}. Theo chính sách, khoản đặt cọc ${totalPaid}đ sẽ không được hoàn lại.`,
      },
      conn
    );

    await conn.commit();
    return { message: "Hủy đơn thành công (mất cọc)." };
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Lỗi khi hủy đơn cọc (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  } finally {
    if (conn) conn.release();
  }
};

/**
 * (MỚI)
 * Bước 6B: Hủy đơn (Khi đã THANH TOÁN 100% - Hoàn tiền)
 */
const cancelPaidOrder = async (userId, orderId) => {
  let conn;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    const order = await rentalOrderModel.findById(orderId, conn);
    if (!order) throw new Error("Không tìm thấy đơn hàng.");
    if (order.USER_ID !== userId) throw new Error("Không có quyền truy cập.");
    if (order.STATUS !== "CONFIRMED") {
      throw new Error("Chỉ hủy được đơn đã 'CONFIRMED'.");
    }

    // Chỉ xử lý đơn đã PAID
    if (order.PAYMENT_STATUS !== "PAID") {
      throw new Error("Chức năng này chỉ dùng để hủy đơn đã thanh toán 100%.");
    }

    const totalPaid = await paymentModel.getTotalPaidByOrderId(orderId, conn);

    // !! LOGIC TÍNH PHÍ (Giả định)
    // Bạn cần thay bằng logic thực tế (dựa vào START_DATE)
    const cancellationFee = order.FINAL_AMOUNT * 0.1; // Giả sử phí 10%
    const refundAmount = totalPaid - cancellationFee;

    const orderUpdates = {
      STATUS: "CANCELLED",
      EXTRA_FEE: cancellationFee,
      NOTE: `Hủy khi đã trả 100%. Phí 10% (${cancellationFee}đ). Hoàn ${refundAmount}đ.`,
    };

    // 1. Cập nhật DB
    await rentalOrderModel.update(orderId, orderUpdates, conn);
    await carModel.updateCarStatus(order.CAR_ID, "AVAILABLE", conn);

    // 2. Gọi API Refund PayOS (Bỏ qua nếu không dùng)
    // const refundResult = await payos.refund(...);
    // ... (Xử lý kết quả refund) ...

    // 3. Ghi nhận giao dịch REFUND vào DB
    await paymentModel.create(
      {
        orderId: orderId,
        amount: -Math.abs(refundAmount), // Ghi số âm
        paymentType: "REFUND",
        method: "PayOS", // Hoặc 'CASH' nếu trả TM
        status: "SUCCESS", // Giả sử refund thành công
        transactionCode: `REFUND_${orderId}`,
      },
      conn
    );

    // 4. (MỚI) Tạo thông báo
    await notificationModel.create(
      {
        USER_ID: order.USER_ID,
        TITLE: `Đơn hàng ${order.ORDER_CODE} đã được hủy và hoàn tiền`,
        CONTENT: `Bạn đã hủy đơn hàng ${order.ORDER_CODE}. Phí hủy là ${cancellationFee}đ. Khoản tiền ${refundAmount}đ sẽ được hoàn lại cho bạn.`,
      },
      conn
    );

    await conn.commit();
    return {
      message: `Hủy đơn thành công. Phí: ${cancellationFee}. Hoàn: ${refundAmount}.`,
    };
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Lỗi khi hủy đơn PAID (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  createOrder,
  cancelPendingOrder,
  processExpiredOrders,
  confirmOrderPickup,
  completeOrder,
  cancelDepositedOrder,
  cancelPaidOrder,
};
