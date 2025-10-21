// src/utils/enumMapper.js
const EnumMapper = {
  CAR: {
    TRANSMISSION: {
      MANUAL: "Số sàn",
      AUTOMATIC: "Số tự động",
    },
    FUEL_TYPE: {
      PETROL: "Xăng",
      DIESEL: "Dầu diesel",
      ELECTRIC: "Điện",
      HYBRID: "Lai (Hybrid)",
    },
    STATUS: {
      AVAILABLE: "Sẵn sàng",
      RENTED: "Đang cho thuê",
      MAINTENANCE: "Bảo dưỡng",
      RESERVED: "Đã đặt trước",
      DELETED: "Đã xóa",
    },
  },

  DISCOUNT: {
    TYPE: {
      PERCENT: "Phần trăm",
      AMOUNT: "Số tiền",
    },
    STATUS: {
      ACTIVE: "Đang hoạt động",
      INACTIVE: "Ngừng hoạt động",
      EXPIRED: "Hết hạn",
    },
  },

  RENTAL_ORDER: {
    STATUS: {
      PENDING: "Chờ xác nhận",
      CONFIRMED: "Đã xác nhận",
      FEE_INCURRED: "Phát sinh phí",
      RETURNED: "Đã trả xe",
      CANCELLED: "Đã hủy",
    },
  },

  PAYMENT: {
    METHOD: {
      PayOS: "Thanh toán PayOS",
      CASH: "Tiền mặt",
    },
    STATUS: {
      PROCESSING: "Đang xử lý",
      SUCCESS: "Thành công",
      FAILED: "Thất bại",
      REFUNDED: "Hoàn tiền",
    },
  },

  INCIDENT: {
    STATUS: {
      NEW: "Mới tạo",
      IN_PROGRESS: "Đang xử lý",
      RESOLVED: "Đã xử lý",
      CLOSED: "Đã đóng",
    },
  },

  BANNERS: {
    STATUS: {
      ACTIVE: "Đang hiển thị",
      INACTIVE: "Ẩn",
    },
  },
};
function translateEnum(table, field, value) {
  return EnumMapper?.[table]?.[field]?.[value] || value;
}
module.exports = {
  translateEnum,
  EnumMapper,
};
