const { connection } = require("../config/database");
const rentalOrderModel = require("../models/rentalOrder");
const paymentModel = require("../models/payment");
const carModel = require("../models/car");
const discountModel = require("../models/discount");
const notificationModel = require("../models/notification");
const userModel = require("../models/user");
const payos = require("../config/payos");
const { v4: uuidv4 } = require("uuid");

/**
 * (User) Lấy danh sách đơn hàng của chính mình
 */
const getLoginUserOrders = async (userId) => {
  try {
    // Hàm findByUserId đã tồn tại trong model
    const orders = await rentalOrderModel.findByUserId(userId);
    return orders;
  } catch (error) {
    console.error("Lỗi khi lấy đơn hàng cá nhân (Service):", error);
    throw new Error("Lỗi hệ thống khi tải danh sách đơn hàng.");
  }
};
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
 * [ADMIN ONLY] Hàm tính giá chặt chẽ cho Web Admin
 * Không dùng logic lai tạp (hybrid). Chọn gì tính nấy.
 */
const calculateStrictPrice = (car, startDate, endDate, rentalType) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Validate cơ bản
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  // Validate Logic: Ngày trả phải sau ngày nhận
  if (end <= start) return 0;

  const totalMilliseconds = end - start;
  const totalHours = totalMilliseconds / (1000 * 60 * 60);

  // --- LOGIC TÍNH TOÁN ---
  if (rentalType === "hour") {
    // 1. Theo Giờ: Làm tròn lên từng giờ (Ví dụ: 2h15p -> 3h)
    const chargedHours = Math.ceil(totalHours);
    const pricePerHour = parseFloat(car.PRICE_PER_HOUR) || 0;
    return Math.round(chargedHours * pricePerHour);
  } else {
    // 2. Theo Ngày: Làm tròn lên từng ngày (Ví dụ: 25h -> 2 ngày)
    // Mặc định rentalType là 'day' hoặc null đều vào đây
    const chargedDays = Math.max(Math.ceil(totalHours / 24), 1);
    const pricePerDay = parseFloat(car.PRICE_PER_DAY) || 0;
    return Math.round(chargedDays * pricePerDay);
  }
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

    let finalAmount = totalAmount; // Giá cuối cùng

    let discountId = null;

    // 3. Khởi tạo Transaction
    conn = await connection.getConnection();
    await conn.beginTransaction();

    //Xử lý mã giảm giá
    if (discountCode) {
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
      pickupBranchId: car.BRANCH_ID,
      returnBranchId: car.BRANCH_ID,
    };

    // 5. DB Update (trong transaction)
    // 5.1. INSERT INTO RENTAL_ORDER
    const { orderId } = await rentalOrderModel.create(orderData, conn);

    // 5.2. UPDATE CAR STATUS = 'RESERVED'
    const oldStatus = car.STATUS;
    const newStatus = "RESERVED";
    await carModel.updateCarStatus(carId, newStatus, conn);

    // [THÊM] 5.3. GHI LOG
    await carModel.logStatusChange(
      carId,
      oldStatus, // "AVAILABLE"
      newStatus,
      `Đặt chỗ cho đơn hàng ${orderCode}`,
      conn
    );

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
      cancelUrl: `${process.env.RESULT_URL}/cancel`,
      returnUrl: `${process.env.RESULT_URL}/result`,
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

    // 3. GHI LOG
    await carModel.logStatusChange(
      order.CAR_ID,
      "RESERVED", // Logic: PENDING_PAYMENT order luôn giữ xe "RESERVED"
      "AVAILABLE",
      `Hủy đơn PENDING_PAYMENT ${order.ORDER_CODE}`,
      conn
    );
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
        const newStatus = "AVAILABLE";
        // 1. UPDATE RENTAL_ORDER
        await rentalOrderModel.update(
          order.ORDER_ID,
          { STATUS: "CANCELLED" },
          orderConn
        );

        // 2. UPDATE CAR
        await carModel.updateCarStatus(order.CAR_ID, "AVAILABLE", orderConn);
        // 3. GHI LOG
        await carModel.logStatusChange(
          order.CAR_ID,
          "RESERVED",
          newStatus,
          `Hệ thống tự hủy đơn hết hạn ${order.ORDER_ID}`,
          orderConn
        );
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
    console.error("CRON: Lỗi nghiêm trọng khi quét đơn:", error);
  } finally {
    if (conn) conn.release();
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
      STATUS: "IN_PROGRESS",
    };

    // TH1: Đơn cọc (PARTIAL)
    if (order.PAYMENT_STATUS === "PARTIAL") {
      if (!cashPaymentData || !cashPaymentData.amount) {
        throw new Error("Cần nhập số tiền mặt đã thu (90% còn lại).");
      }

      // --- [CẢI TIẾN BẮT ĐẦU TỪ ĐÂY] ---

      // 1. Lấy số tiền đã cọc
      const totalPaid = await paymentModel.getTotalPaidByOrderId(orderId, conn);

      // 2. Tính số tiền CẦN THU
      const remainingAmount = order.FINAL_AMOUNT - totalPaid;

      // 3. Lấy số tiền admin NHẬP
      const adminInputAmount = parseFloat(cashPaymentData.amount);

      // 4. So sánh
      if (adminInputAmount !== remainingAmount) {
        // Làm tròn để tránh lỗi javascript (ví dụ: 100.01 vs 100.009)
        if (Math.round(adminInputAmount) !== Math.round(remainingAmount)) {
          throw new Error(
            `Số tiền thu không khớp. Hệ thống yêu cầu ${remainingAmount}đ, bạn đã nhập ${adminInputAmount}đ.`
          );
        }
      }

      // 5. Ghi nhận giao dịch (nếu đã qua bước kiểm tra)
      await paymentModel.create(
        {
          orderId: orderId,
          amount: adminInputAmount, // Dùng số tiền admin đã nhập
          paymentType: "FINAL_PAYMENT",
          method: "CASH",
          status: "SUCCESS",
          transactionCode: `CASH_${orderId}_${adminId}`,
        },
        conn
      );

      updates.PAYMENT_STATUS = "PAID";
    }
    // TH2: Đã PAID (trả 100%), bỏ qua

    await rentalOrderModel.update(orderId, updates, conn);
    const newStatus = "RENTED";
    await carModel.updateCarStatus(order.CAR_ID, newStatus, conn);
    await carModel.logStatusChange(
      order.CAR_ID,
      "RESERVED", // Logic: Đơn "CONFIRMED" (trạng thái trước đó) là xe "RESERVED"
      newStatus,
      `Bàn giao xe cho đơn hàng ${order.ORDER_CODE}`,
      conn
    );
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
  rating,
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
    const newStatus = carReturnStatus;
    await carModel.updateCarStatus(order.CAR_ID, newStatus, conn);

    await carModel.logStatusChange(
      order.CAR_ID,
      "RENTED", // Logic: Đơn "IN_PROGRESS" (trạng thái trước đó) là xe "RENTED"
      newStatus,
      `Hoàn tất, trả xe từ đơn hàng ${order.ORDER_CODE}`,
      conn
    );
    const parsedRating = parseFloat(rating);
    if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
      // Lấy USER_ID từ đơn hàng đã hoàn thành
      const userId = order.USER_ID; // Cập nhật rating
      await userModel.updateRating(userId, parsedRating);
    }
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
    const newStatus = "AVAILABLE";
    await carModel.updateCarStatus(order.CAR_ID, newStatus, conn);

    // 3. GHI LOG
    await carModel.logStatusChange(
      order.CAR_ID,
      "RESERVED", // Logic: Đơn "CONFIRMED" (trạng thái trước đó)
      newStatus,
      `Hủy đơn (mất cọc) ${order.ORDER_CODE}`,
      conn
    );
    // 4. Tạo thông báo cho user
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
const cancelPaidOrder = async (userId, orderId, refundInfo) => {
  let conn;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    // [SỬA] Lấy thông tin STK từ refundInfo
    const { bankAccount, bankName } = refundInfo;
    if (!bankAccount || !bankName) {
      // Đã validate ở controller, nhưng check lại cho chắc
      throw new Error("Vui lòng cung cấp Số tài khoản và Tên ngân hàng.");
    }

    const order = await rentalOrderModel.findById(orderId, conn);
    if (!order) throw new Error("Không tìm thấy đơn hàng.");
    if (order.USER_ID !== userId) throw new Error("Không có quyền truy cập.");
    if (order.STATUS !== "CONFIRMED") {
      throw new Error("Chỉ hủy được đơn đã 'CONFIRMED'.");
    }
    if (order.PAYMENT_STATUS !== "PAID") {
      throw new Error("Chức năng này chỉ dùng để hủy đơn đã thanh toán 100%.");
    }

    const totalPaid = await paymentModel.getTotalPaidByOrderId(orderId, conn);

    // [SỬA] LOGIC TÍNH PHÍ THỰC TẾ (THEO CHÍNH SÁCH)
    // ---------------------------------------------------
    const now = new Date();
    const startDate = new Date(order.START_DATE);

    // Tính số giờ chênh lệch
    const hoursDiff = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let cancellationFee;
    let feePercentage;
    let policyNote;

    if (hoursDiff >= 24) {
      // Hủy trước 24 giờ: Phí 10%
      feePercentage = 0.1;
      policyNote = "Hủy trước 24h (đã trả 100%), phí 10%.";
    } else {
      // Hủy trong vòng 24 giờ: Phí 50%
      feePercentage = 0.5;
      policyNote = "Hủy trong vòng 24h (đã trả 100%), phí 50%.";
    }

    // Tính phí dựa trên FINAL_AMOUNT (tổng tiền sau giảm giá mà user phải trả)
    cancellationFee = order.FINAL_AMOUNT * feePercentage;
    const refundAmount = totalPaid - cancellationFee;
    // ---------------------------------------------------

    // [SỬA] Cập nhật NOTE bao gồm thông tin hoàn tiền
    const orderUpdates = {
      STATUS: "CANCELLED",
      EXTRA_FEE: cancellationFee,
      NOTE: `${policyNote} Hoàn ${refundAmount}đ. STK: ${bankAccount} - ${bankName}.`,
    };

    // 1. Cập nhật RENTAL_ORDER và CAR
    await rentalOrderModel.update(orderId, orderUpdates, conn);

    const newStatus = "AVAILABLE";
    await carModel.updateCarStatus(order.CAR_ID, newStatus, conn);

    // [THÊM] GHI LOG
    await carModel.logStatusChange(
      order.CAR_ID,
      "RESERVED", // Logic: Đơn "CONFIRMED" (trạng thái trước đó)
      newStatus,
      `Hủy đơn (hoàn tiền) ${order.ORDER_CODE}`,
      conn
    );

    // 2. Ghi nhận giao dịch REFUND (Chờ xử lý)
    if (refundAmount > 0) {
      await paymentModel.create(
        {
          orderId: orderId,
          amount: -Math.abs(refundAmount), // Ghi số âm
          paymentType: "REFUND",
          method: "PayOS", // Hoặc "BANK_TRANSFER"
          status: "PROCESSING", // [SỬA] Chuyển thành PROCESSING để Admin duyệt
          transactionCode: `REFUND_REQ_${orderId}`,
        },
        conn
      );
    }

    // 4. [MỚI] Tạo thông báo tới USER (Theo Yêu cầu 4)
    await notificationModel.create(
      {
        USER_ID: order.USER_ID,
        TITLE: `Yêu cầu hoàn tiền thành công`,
        CONTENT: `Yêu cầu hủy đơn ${order.ORDER_CODE} đã được ghi nhận. Phí hủy: ${cancellationFee}đ. Khoản tiền ${refundAmount}đ sẽ được hoàn vào STK ${bankAccount} (${bankName}) trong vòng 3 đến 5 ngày làm việc.`,
      },
      conn
    );

    // 5. [MỚI] Tạo thông báo tới ADMIN (Theo Yêu cầu 3)
    const adminUser = await userModel.findByRole("ADMIN", conn);
    if (adminUser) {
      await notificationModel.create(
        {
          USER_ID: adminUser.USER_ID, // Gửi cho Admin
          TITLE: `Hoàn tiền đơn hàng '${order.ORDER_CODE}'`,
          CONTENT: `Yêu cầu hoàn tiền ${refundAmount}đ cho đơn ${order.ORDER_CODE}. STK: ${bankAccount}, Ngân hàng: ${bankName}.`,
        },
        conn
      );
    } else {
      // Không làm hỏng giao dịch nếu không tìm thấy Admin
      console.warn("Không tìm thấy ADMIN user để gửi thông báo hoàn tiền.");
    }

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

/**
 * [SỬA ĐỔI] (Admin) Lấy tất cả đơn hàng (kèm số lượng giao dịch và tiền còn lại)
 */
const adminGetAllOrders = async () => {
  try {
    // 1. Hàm này giờ trả về thêm "totalPaid"
    const orders = await rentalOrderModel.adminGetAllWithTxCount();

    // 2. Map qua kết quả để tính toán
    const ordersWithRemaining = orders.map((order) => {
      let remainingAmount = 0;

      // 3. Nếu là đơn cọc (PARTIAL)
      if (order.PAYMENT_STATUS === "PARTIAL") {
        // Lấy tổng tiền đã trả (từ SQL, có thể là null nếu chưa có)
        const totalPaid = parseFloat(order.totalPaid || 0);

        // Tính số tiền còn lại
        remainingAmount = order.FINAL_AMOUNT - totalPaid;
      }

      // 4. Xóa trường 'totalPaid' (không cần thiết) và thêm 'remainingAmount'
      const { totalPaid, ...restOfOrder } = order;

      return {
        ...restOfOrder,
        remainingAmount: Math.max(0, remainingAmount), // Đảm bảo không bị âm
      };
    });

    return ordersWithRemaining;
  } catch (error) {
    console.error("Lỗi khi lấy tất cả đơn hàng (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  }
};
/**
 * [SỬA ĐỔI] (Admin) Lấy chi tiết đơn hàng (kèm danh sách giao dịch và tiền còn lại)
 */
const adminGetOrderById = async (orderId) => {
  try {
    // 1. Lấy thông tin đơn hàng KÈM REVIEW
    const orderWithReview = await rentalOrderModel.findDetailById(orderId);
    if (!orderWithReview) {
      throw new Error("Không tìm thấy đơn hàng.");
    }
    const order = orderWithReview; // order đã có trường order.review

    // 2. Lấy tất cả giao dịch liên quan
    const payments = await paymentModel.findByOrderId(orderId);

    // 3. Tính toán số tiền còn lại (nếu là PARTIAL)
    let remainingAmount = 0;

    if (order.PAYMENT_STATUS === "PARTIAL") {
      const totalPaid = payments
        .filter((p) => p.STATUS === "SUCCESS" && p.AMOUNT > 0)
        .reduce((sum, p) => sum + parseFloat(p.AMOUNT), 0);

      remainingAmount = order.FINAL_AMOUNT - totalPaid;
    }

    // 4. Gộp lại
    return {
      ...order,
      remainingAmount: Math.max(0, remainingAmount),
      payments: payments,
    };
  } catch (error) {
    console.error("Lỗi khi lấy chis tiết đơn hàng (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  }
};

/**
 * [MỚI] (Admin) Xóa cứng đơn hàng
 */
const adminHardDeleteOrder = async (orderId, adminId) => {
  let conn;
  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    // 1. Lấy thông tin đơn hàng (để lấy CAR_ID và USER_ID) trước khi xóa
    const order = await rentalOrderModel.findById(orderId, conn);
    if (!order) {
      throw new Error("Không tìm thấy đơn hàng để xóa.");
    }

    // 2. Xác định trạng thái cũ của xe dựa trên trạng thái đơn
    let oldCarStatus;
    if (order.STATUS === "IN_PROGRESS") {
      oldCarStatus = "RENTED";
    } else if (
      order.STATUS === "CONFIRMED" ||
      order.STATUS === "PENDING_PAYMENT"
    ) {
      oldCarStatus = "RESERVED";
    } else {
      // (COMPLETED, CANCELLED)
      oldCarStatus = "AVAILABLE";
    }
    const newStatus = "AVAILABLE";

    // Cập nhật trạng thái xe lại thành 'AVAILABLE'
    await carModel.updateCarStatus(order.CAR_ID, newStatus, conn);
    // 3. GHI LOG
    await carModel.logStatusChange(
      order.CAR_ID,
      oldCarStatus,
      newStatus,
      `Admin xóa cứng đơn hàng ${order.ORDER_CODE} (trạng thái cũ: ${oldCarStatus})`,
      conn
    );
    // 4. Tạo thông báo cho người dùng
    await notificationModel.create(
      {
        USER_ID: order.USER_ID,
        TITLE: `Đơn hàng ${order.ORDER_CODE} đã bị xóa`,
        CONTENT: `Đơn hàng ${order.ORDER_CODE} của bạn đã bị xóa bởi quản trị viên. Vui lòng liên hệ hỗ trợ nếu có thắc mắc.`,
      },
      conn
    );

    // 4. Xóa cứng đơn hàng (PAYMENT tự động xóa theo nhờ ON DELETE CASCADE)
    await rentalOrderModel.hardDeleteById(orderId, conn);

    await conn.commit();
    return {
      message: `Đã xóa vĩnh viễn đơn hàng ${order.ORDER_CODE} và cập nhật lại xe.`,
    };
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Lỗi khi xóa cứng đơn hàng (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  } finally {
    if (conn) conn.release();
  }
};

/**
 * [MỚI] (Admin) Lấy lịch sử thuê của một user
 */
const adminGetUserOrders = async (userId) => {
  try {
    // 1. Kiểm tra user tồn tại (tùy chọn nhưng nên có)
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error("Không tìm thấy người dùng.");
    }
    // 2. Lấy đơn hàng
    const orders = await rentalOrderModel.findByUserId(userId);
    return orders;
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử đơn hàng của user (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  }
};

/**
 * [MỚI] (Admin) Tự tạo đơn (Manual Order)
 */
const adminCreateManualOrder = async (adminId, orderDetails) => {
  let conn;
  try {
    const {
      userId,
      carId,
      startDate,
      endDate,
      rentalType,
      paymentMethod,
      paymentStatus,
      amountPaid,
      note,
    } = orderDetails;

    // 1. CHUẨN HÓA INPUT
    // Nếu frontend không gửi, fallback về 'day'
    const typeToUse = rentalType === "hour" ? "hour" : "day";

    // 2. Lấy và kiểm tra xe
    const car = await carModel.getCarById(carId);
    if (!car) throw new Error("Không tìm thấy xe.");
    if (car.STATUS !== "AVAILABLE") throw new Error("Xe không khả dụng.");

    // 3. TÍNH GIÁ (DÙNG HÀM STRICT RIÊNG)
    const rentalPrice = calculateStrictPrice(
      car,
      startDate,
      endDate,
      typeToUse
    );

    if (rentalPrice <= 0) {
      throw new Error(
        typeToUse === "hour"
          ? "Lỗi tính giá: Giờ trả xe phải sau giờ nhận xe."
          : "Lỗi tính giá: Ngày trả xe phải sau ngày nhận xe."
      );
    }

    const totalAmount = rentalPrice;
    const finalAmount = totalAmount; // Có thể mở rộng logic giảm giá sau này

    // 4. VALIDATE TIỀN NONG (Gatekeeper)
    const paidAmount = parseFloat(amountPaid) || 0;

    // Nếu chọn 'Thanh toán hết' -> Phải nhập đủ tiền
    if (paymentStatus === "PAID" && paidAmount < finalAmount) {
      throw new Error(
        `Trạng thái là 'Thanh toán hết' nhưng số tiền nhập vào (${paidAmount}) nhỏ hơn tổng tiền (${finalAmount}).`
      );
    }
    // Nếu chọn 'Đặt cọc' -> Phải có tiền cọc
    if (paymentStatus === "PARTIAL" && paidAmount <= 0) {
      throw new Error("Vui lòng nhập số tiền đặt cọc lớn hơn 0.");
    }

    conn = await connection.getConnection();
    await conn.beginTransaction();

    const orderCode = uuidv4();

    // 5. TẠO NOTE TỰ ĐỘNG (Để minh bạch loại hình thuê)
    const autoNote = `[Admin Book: ${
      typeToUse === "hour" ? "Theo Giờ" : "Theo Ngày"
    }]`;
    const finalNote = note ? `${autoNote} ${note}` : autoNote;

    const orderData = {
      orderCode,
      userId,
      carId,
      startDate,
      endDate,
      rentalPrice,
      totalAmount,
      finalAmount,
      expiresAt: null,
      discountId: null,
      status: "CONFIRMED",
      paymentStatus: paymentStatus,
      NOTE: finalNote,
      pickupBranchId: car.BRANCH_ID,
      returnBranchId: car.BRANCH_ID,
    };

    // 6. INSERT ORDER
    const { orderId } = await rentalOrderModel.create(orderData, conn);

    // 7. UPDATE CAR & LOG
    const oldStatus = car.STATUS;
    const newStatus = "RESERVED";
    await carModel.updateCarStatus(carId, newStatus, conn);

    await carModel.logStatusChange(
      carId,
      oldStatus,
      newStatus,
      `Admin tạo đơn thủ công ${orderCode} (${typeToUse})`,
      conn
    );

    // 8. [FIX] TẠO PAYMENT RECORD (CHO CẢ CASH VÀ BANK_TRANSFER)
    if (
      (paymentMethod === "CASH" || paymentMethod === "BANK_TRANSFER") &&
      (paymentStatus === "PAID" || paymentStatus === "PARTIAL")
    ) {
      if (paidAmount > 0) {
        // [FIX] Nếu là Chuyển khoản -> Lưu method là "PayOS" để đối soát
        const dbMethod = paymentMethod === "BANK_TRANSFER" ? "PayOS" : "CASH";

        // Tạo mã giao dịch để phân biệt nguồn
        const transPrefix =
          paymentMethod === "BANK_TRANSFER" ? "MANUAL_BANK" : "MANUAL_CASH";

        await paymentModel.create(
          {
            orderId: orderId,
            amount: paidAmount,
            paymentType: paymentStatus === "PAID" ? "FINAL_PAYMENT" : "DEPOSIT",
            method: dbMethod, // "PayOS" hoặc "CASH"
            status: "SUCCESS", // Admin đã xác nhận nhận tiền
            transactionCode: `${transPrefix}_${orderId}_${adminId}`,
          },
          conn
        );
      }
    }

    // 9. Gửi thông báo
    await notificationModel.create(
      {
        USER_ID: userId,
        TITLE: `Đơn hàng mới ${orderCode} đã được tạo`,
        CONTENT: `Quản trị viên đã tạo đơn thuê xe (${
          typeToUse === "hour" ? "Theo Giờ" : "Theo Ngày"
        }) cho bạn.`,
      },
      conn
    );

    await conn.commit();
    return { orderId, orderCode, message: "Tạo đơn hàng thành công." };
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Lỗi service (Admin Create Order):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  } finally {
    if (conn) conn.release();
  }
};

const adminUpdateOrder = async (orderId, updateData) => {
  let conn;
  try {
    const { newStartDate, newEndDate, newCarId, newNote } = updateData;

    conn = await connection.getConnection();
    await conn.beginTransaction();

    const order = await rentalOrderModel.findById(orderId, conn);
    if (!order) throw new Error("Không tìm thấy đơn hàng.");

    // Chỉ cho sửa đơn 'CONFIRMED' (chưa lấy xe)
    if (order.STATUS !== "CONFIRMED") {
      throw new Error("Chỉ có thể cập nhật đơn hàng ở trạng thái 'CONFIRMED'.");
    }

    const orderUpdates = {
      START_DATE: newStartDate || order.START_DATE,
      END_DATE: newEndDate || order.END_DATE,
      CAR_ID: newCarId || order.CAR_ID,
      NOTE: newNote || order.NOTE,
    };

    // 1. Nếu đổi xe
    if (newCarId && newCarId !== order.CAR_ID) {
      const newCar = await carModel.getCarById(newCarId, conn);
      if (newCar.STATUS !== "AVAILABLE") {
        throw new Error("Xe mới được chọn không khả dụng.");
      }
      // Cập nhật xe mới
      const newCarOldStatus = newCar.STATUS; // "AVAILABLE"
      const newCarNewStatus = "RESERVED";
      await carModel.updateCarStatus(newCarId, newCarNewStatus, conn);
      // [THÊM] GHI LOG (XE MỚI)
      await carModel.logStatusChange(
        newCarId,
        newCarOldStatus,
        newCarNewStatus,
        `Admin đổi xe (nhận xe mới) cho đơn ${order.ORDER_CODE}`,
        conn
      );
      // Trả xe cũ
      const oldCarOldStatus = "RESERVED"; // Logic: Đơn "CONFIRMED"
      const oldCarNewStatus = "AVAILABLE";
      await carModel.updateCarStatus(order.CAR_ID, oldCarNewStatus, conn);

      // [THÊM] GHI LOG (XE CŨ)
      await carModel.logStatusChange(
        order.CAR_ID,
        oldCarOldStatus,
        oldCarNewStatus,
        `Admin đổi xe (trả xe cũ) cho đơn ${order.ORDER_CODE}`,
        conn
      );
    }

    // 2. Nếu đổi xe hoặc đổi ngày -> Tính lại giá
    if (newCarId || newStartDate || newEndDate) {
      const carToCalc = newCarId
        ? await carModel.getCarById(newCarId, conn)
        : await carModel.getCarById(order.CAR_ID, conn);

      const price = calculatePrice(
        carToCalc,
        orderUpdates.START_DATE,
        orderUpdates.END_DATE,
        "day" // Giả định
      );

      orderUpdates.RENTAL_PRICE = price;
      orderUpdates.TOTAL_AMOUNT = price;
      orderUpdates.FINAL_AMOUNT = price; // Bỏ qua logic giảm giá lại cho đơn giản

      // LƯU Ý: Việc tính lại giá có thể ảnh hưởng đến PAYMENT_STATUS
      // (ví dụ: cọc 100k, giá mới tăng, đơn trở thành PARTIAL)
      // Logic này cần được làm phức tạp hơn trong thực tế.
    }

    // 3. Cập nhật đơn hàng
    await rentalOrderModel.update(orderId, orderUpdates, conn);

    // 4. Gửi thông báo
    await notificationModel.create(
      {
        USER_ID: order.USER_ID,
        TITLE: `Đơn hàng ${order.ORDER_CODE} đã được cập nhật`,
        CONTENT: `Quản trị viên đã cập nhật thông tin đơn hàng của bạn.`,
      },
      conn
    );

    await conn.commit();
    return { message: "Cập nhật đơn hàng thành công." };
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Lỗi khi cập nhật đơn hàng (Service):", error);
    throw new Error(error.message || "Lỗi hệ thống.");
  } finally {
    if (conn) conn.release();
  }
};
/**
 * [MỚI] (User) Thay đổi ngày thuê (KHÔNG KIỂM TRA XUNG ĐỘT)
 */
const changeRentalDate = async (userId, orderId, newStartDate, newEndDate) => {
  let conn;
  try {
    // 0. Validate input
    const newStart = new Date(newStartDate);
    const newEnd = new Date(newEndDate);
    const now = new Date();

    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      // LỖI 1: Ngày không hợp lệ
      throw new Error(
        "Ngày tháng bạn chọn không hợp lệ. Vui lòng kiểm tra lại."
      );
    }

    // 1. (Constraint 2)
    if (newStart <= now) {
      // LỖI 2: Đổi về quá khứ
      throw new Error(
        "Bạn không thể đổi lịch thuê về thời điểm trong quá khứ."
      );
    }

    // 2. Bắt đầu Transaction
    conn = await connection.getConnection();
    await conn.beginTransaction();

    // 3. Lấy đơn hàng gốc
    const order = await rentalOrderModel.findById(orderId, conn);
    if (!order) {
      // LỖI 3: Không tìm thấy
      throw new Error("Không tìm thấy đơn hàng này.");
    }

    // 4. Kiểm tra quyền sở hữu
    if (order.USER_ID !== userId) {
      // LỖI 4: Không có quyền
      throw new Error("Bạn không có quyền thay đổi đơn hàng này.");
    }

    // 5. Kiểm tra trạng thái đơn hàng
    if (order.STATUS !== "CONFIRMED") {
      // LỖI 5: Sai trạng thái
      throw new Error(
        "Bạn chỉ có thể đổi ngày cho các đơn hàng 'Đã xác nhận' và 'Chưa nhận xe'."
      );
    }

    // 6. (Constraint 1) Kiểm tra thời lượng
    const oldStart = new Date(order.START_DATE);
    const oldEnd = new Date(order.END_DATE);

    const oldDurationMs = oldEnd.getTime() - oldStart.getTime();
    const newDurationMs = newEnd.getTime() - newStart.getTime();

    // So sánh (chính xác đến từng mili-giây)
    if (oldDurationMs !== newDurationMs) {
      // LỖI 6: Sai thời lượng
      throw new Error(
        "Thời lượng thuê mới phải bằng chính xác thời lượng thuê ban đầu."
      );
    }

    // 7. BỎ QUA KIỂM TRA XUNG ĐỘT

    // 8. Cập nhật đơn hàng
    const updates = {
      START_DATE: newStartDate,
      END_DATE: newEndDate,
    };
    await rentalOrderModel.update(orderId, updates, conn);

    // 9. (Nên có) Gửi thông báo cho user
    await notificationModel.create(
      {
        USER_ID: userId,
        TITLE: `Đơn hàng ${order.ORDER_CODE} đã được cập nhật`,
        CONTENT: `Lịch thuê xe của bạn đã được đổi thành công sang: ${newStartDate} - ${newEndDate}.`,
      },
      conn
    );

    // 10. Commit
    await conn.commit();
    return { message: "Cập nhật lịch thuê thành công." };
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Lỗi khi đổi ngày thuê (Service):", error);

    // Phân loại lỗi để trả về status code phù hợp ở Controller
    // Lỗi 404/403
    if (
      error.message.includes("Không tìm thấy") || // Lỗi 3
      error.message.includes("không có quyền") // Lỗi 4
    ) {
      throw new Error(error.message);
    }
    // Lỗi 400
    if (
      error.message.includes("quá khứ") || // Lỗi 2
      error.message.includes("Thời lượng thuê") || // Lỗi 6
      error.message.includes("không hợp lệ") || // Lỗi 1
      error.message.includes("Chỉ có thể đổi ngày") // Lỗi 5
    ) {
      throw new Error(error.message);
    }

    // Lỗi 500
    throw new Error(error.message || "Lỗi hệ thống khi đổi ngày thuê.");
  } finally {
    if (conn) conn.release();
  }
};
module.exports = {
  getLoginUserOrders,
  createOrder,
  cancelPendingOrder,
  processExpiredOrders,
  confirmOrderPickup,
  completeOrder,
  changeRentalDate,
  cancelDepositedOrder,
  cancelPaidOrder,
  adminGetAllOrders,
  adminGetOrderById,
  adminHardDeleteOrder,
  adminGetUserOrders,
  adminCreateManualOrder,
  adminUpdateOrder,
};
