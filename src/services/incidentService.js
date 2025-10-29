// services/incident.service.js
const { connection } = require("../config/database"); // Đây là POOL
const path = require("path");
const fs = require("fs/promises");

const rentalOrderModel = require("../models/rentalOrder");
const IncidentModel = require("../models/incident");
const IncidentMediaModel = require("../models/incidentMedia");
const NotificationModel = require("../models/notification");
const UserModel = require("../models/user");

// Helper (Không đổi)
const getMediaType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "IMAGE";
  if (mimetype.startsWith("video/")) return "VIDEO";
  if (mimetype.startsWith("audio/")) return "AUDIO";
  return "DOCUMENT";
};

/**
 * (User) Tạo sự cố mới
 */
const createIncident = async (incidentData, files, userId) => {
  let conn = null;

  try {
    conn = await connection.getConnection();
    await conn.beginTransaction();

    // 1a. Kiểm tra trạng thái đơn hàng (RENTAL_ORDER)
    const order = await rentalOrderModel.findById(incidentData.ORDER_ID, conn);

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng.");
    }

    // Dựa theo ENUM của bạn, 'IN_PROGRESS' là trạng thái "đang thuê"
    if (order.STATUS !== "IN_PROGRESS") {
      throw new Error(
        `Chỉ có thể báo cáo sự cố cho đơn hàng đang trong trạng thái 'IN_PROGRESS'. Trạng thái hiện tại của đơn hàng là: ${order.STATUS}`
      );
    }

    // 1b. Kiểm tra ràng buộc (Sự cố đã tồn tại)
    const existingIncident = await IncidentModel.findByOrderId(
      incidentData.ORDER_ID,
      conn
    );
    if (existingIncident) {
      throw new Error("Đơn hàng này đã tồn tại một báo cáo sự cố.");
    }

    // 2. Tạo sự cố chính
    const data = { ...incidentData, USER_ID: userId };
    const incidentId = await IncidentModel.create(data, conn);

    // 3. Xử lý file media (nếu có)
    if (files && files.length > 0) {
      const mediaData = files.map((file) => [
        incidentId,
        `/incidents/${file.filename}`,
        getMediaType(file.mimetype),
      ]);
      await IncidentMediaModel.createBulk(mediaData, conn);
    }

    // 4. [ĐÃ SỬA] Gửi thông báo cho 1 Admin
    const admin = await UserModel.findByRole("ADMIN", conn); // Dùng findByRole (LIMIT 1)

    if (admin) {
      // Kiểm tra nếu tìm thấy admin
      const title = "Báo cáo sự cố mới";
      const content = `User (ID: ${userId}) vừa tạo báo cáo sự cố cho đơn hàng ${incidentData.ORDER_ID}.`;

      // Dùng NotificationModel.create (cho 1 user)
      await NotificationModel.create(
        {
          USER_ID: admin.USER_ID,
          TITLE: title,
          CONTENT: content,
        },
        conn
      );
    }

    await conn.commit(); // Hoàn tất
    return { incidentId, message: "Tạo báo cáo sự cố thành công." };
  } catch (error) {
    if (conn) await conn.rollback();

    // Xóa file đã upload nếu thất bại
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const filePath = path.join(
            __dirname,
            "..",
            "public",
            "incidents",
            file.filename
          );
          await fs.unlink(filePath);
        } catch (fileError) {
          console.error("Lỗi khi xóa file (sau khi rollback):", fileError);
        }
      }
    }

    console.error("Lỗi khi tạo sự cố (Service):", error);
    // Trả về lỗi nghiệp vụ rõ ràng
    throw new Error(error.message || "Lỗi khi tạo sự cố.");
  } finally {
    if (conn) conn.release();
  }
};

/**
 * (User) Cập nhật mô tả sự cố
 */
const updateIncidentDescription = async (incidentId, description, userId) => {
  const incident = await IncidentModel.findById(incidentId);
  if (!incident) {
    throw new Error("Không tìm thấy sự cố.");
  }
  if (incident.USER_ID !== userId) {
    throw new Error("Bạn không có quyền chỉnh sửa sự cố này.");
  }
  if (incident.STATUS !== "NEW") {
    throw new Error("Không thể chỉnh sửa sự cố đã được xử lý.");
  }
  const affectedRows = await IncidentModel.updateDescription(
    incidentId,
    description,
    userId
  );
  if (affectedRows === 0) {
    throw new Error("Cập nhật thất bại.");
  }
  return { message: "Cập nhật mô tả thành công." };
};

/**
 * (Admin) Cập nhật trạng thái sự cố
 */
const updateIncidentStatus = async (incidentId, status) => {
  let conn = null; // 👈 1. Khai báo
  try {
    conn = await connection.getConnection(); // 👈 2. Lấy
    await conn.beginTransaction(); // 👈 3. Bắt đầu

    // 1. Lấy thông tin sự cố
    const incident = await IncidentModel.findById(incidentId, conn);
    if (!incident) {
      throw new Error("Không tìm thấy sự cố.");
    }

    // 2. Cập nhật trạng thái
    await IncidentModel.updateStatus(incidentId, status, conn);

    // 3. Gửi thông báo cho người dùng
    const title = "Cập nhật trạng thái sự cố";
    const content = `Báo cáo sự cố (ID: ${incidentId}) của bạn đã được cập nhật trạng thái thành: ${status}.`;

    await NotificationModel.create(
      {
        USER_ID: incident.USER_ID,
        TITLE: title,
        CONTENT: content,
      },
      conn
    );

    await conn.commit(); // 👈 4. Hoàn tất
    return { message: `Cập nhật trạng thái thành ${status} thành công.` };
  } catch (error) {
    if (conn) await conn.rollback(); // 👈 5. Hoàn tác
    console.error("Lỗi khi cập nhật trạng thái (Service):", error);
    throw new Error("Lỗi khi cập nhật trạng thái sự cố.");
  } finally {
    if (conn) conn.release(); // 👈 6. Trả
  }
};

/**
 * (User/Admin) Xóa sự cố
 */
const deleteIncident = async (incidentId, user) => {
  let conn = null; // 👈 1. Khai báo
  try {
    conn = await connection.getConnection(); // 👈 2. Lấy
    await conn.beginTransaction(); // 👈 3. Bắt đầu

    // 1. Kiểm tra quyền
    const incident = await IncidentModel.findById(incidentId, conn);
    if (!incident) {
      throw new Error("Không tìm thấy sự cố.");
    }

    if (user.ROLE !== "ADMIN" && incident.USER_ID !== user.USER_ID) {
      throw new Error("Bạn không có quyền xóa sự cố này.");
    }

    // 2. Lấy danh sách media để xóa file vật lý
    const mediaFiles = await IncidentMediaModel.findByIncidentId(
      incidentId,
      conn
    );

    // 3. Xóa khỏi DB (CASCADE sẽ tự xóa media)
    await IncidentModel.remove(incidentId, conn);

    // 4. Xóa file vật lý khỏi server (làm sau khi commit DB)

    await conn.commit(); // 👈 4. Hoàn tất

    // 5. Xóa file (nên làm sau khi commit để nếu xóa file lỗi thì DB vẫn đúng)
    for (const media of mediaFiles) {
      try {
        const filePath = path.join(__dirname, "..", "public", media.URL);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error(`Lỗi khi xóa file: ${media.URL}`, fileError);
      }
    }

    return { message: "Xóa sự cố thành công." };
  } catch (error) {
    if (conn) await conn.rollback(); // 👈 5. Hoàn tác
    console.error("Lỗi khi xóa sự cố (Service):", error);
    throw new Error(error.message || "Lỗi khi xóa sự cố.");
  } finally {
    if (conn) conn.release(); // 👈 6. Trả
  }
};

/**
 * (Admin) Lấy chi tiết sự cố
 */
const getIncidentById = async (incidentId) => {
  const incident = await IncidentModel.findById(incidentId);
  if (!incident) {
    throw new Error("Không tìm thấy sự cố.");
  }
  const media = await IncidentMediaModel.findByIncidentId(incidentId);
  return { ...incident, media };
};

/**
 * (Admin) Lấy danh sách sự cố
 */
const getAllIncidents = async () => {
  const incidents = await IncidentModel.findAll();
  return incidents;
};

module.exports = {
  createIncident,
  updateIncidentDescription,
  updateIncidentStatus,
  deleteIncident,
  getIncidentById,
  getAllIncidents,
};
