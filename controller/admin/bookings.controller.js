const db = require("../../config/database");

const TABLES = {
  services: {
    table: "SU_DUNG_DICH_VU",
    id: "SDDV_ID",
    bookingStatus: "SDDV_TRANGTHAI_DAT",
    paymentMethod: "SDDV_PHUONGTHUCTT",
    paymentStatus: "SDDV_THANHTOAN",
  },
  rooms: {
    table: "SU_DUNG_PHONG",
    id: "SDP_ID",
    bookingStatus: "SDP_TRANGTHAI_DAT",
    paymentMethod: "SDP_PHUONGTHUCTT",
    paymentStatus: "SDP_THANHTOAN",
  },
};

module.exports.index = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM (
         SELECT
           'services' AS type,
           s.SDDV_ID AS id,
           c.KH_HOTEN AS customerName,
           p.TN_TEN AS petName,
           d.DV_TEN AS itemName,
           DATE_FORMAT(s.SDDV_NGAYSUDUNG, '%Y-%m-%d %H:%i') AS startAt,
           NULL AS endAt,
           s.SDDV_THANHTIEN AS amount,
           s.SDDV_TRANGTHAI_DAT AS bookingStatus,
           s.SDDV_PHUONGTHUCTT AS paymentMethod,
           s.SDDV_THANHTOAN AS paymentStatus,
           s.SDDV_NGAYSUDUNG AS sortDate
         FROM SU_DUNG_DICH_VU s
         JOIN THU_NUOI p ON p.TN_ID = s.TN_ID
         JOIN KHACH_HANG c ON c.KH_ID = p.KH_ID
         JOIN DICH_VU d ON d.DV_ID = s.DV_ID

         UNION ALL

         SELECT
           'rooms' AS type,
           s.SDP_ID AS id,
           c.KH_HOTEN AS customerName,
           p.TN_TEN AS petName,
           r.PHONG_TEN AS itemName,
           DATE_FORMAT(s.SDP_NGAYNHAN, '%Y-%m-%d') AS startAt,
           DATE_FORMAT(s.SDP_NGAYTRA, '%Y-%m-%d') AS endAt,
           s.SDP_TONGTIEN AS amount,
           s.SDP_TRANGTHAI_DAT AS bookingStatus,
           s.SDP_PHUONGTHUCTT AS paymentMethod,
           s.SDP_THANHTOAN AS paymentStatus,
           s.SDP_NGAYNHAN AS sortDate
         FROM SU_DUNG_PHONG s
         JOIN THU_NUOI p ON p.TN_ID = s.TN_ID
         JOIN KHACH_HANG c ON c.KH_ID = p.KH_ID
         JOIN PHONG r ON r.PHONG_ID = s.PHONG_ID
       ) AS bookings
       ORDER BY sortDate DESC`,
    );

    const bookings = rows.map((booking) => ({
      ...booking,
      amountText: `${Number(booking.amount || 0).toLocaleString("vi-VN")}đ`,
    }));

    res.render("admin/pages/bookings/index", {
      pageTitle: "Quản lý lịch đặt",
      path: "/bookings",
      bookings,
      successMessage: req.flash("success")[0] || "",
      errorMessage: req.flash("error")[0] || "",
    });
  } catch (error) {
    console.error("Lỗi tải danh sách lịch đặt:", error.message);
    req.flash("error", "Không thể tải danh sách lịch đặt.");
    res.redirect("/admin/dashboard");
  }
};

async function updateBooking(req, res, action) {
  const config = TABLES[req.params.type];
  const id = Number(req.params.id);

  if (!config || !Number.isInteger(id) || id <= 0) {
    req.flash("error", "Lịch đặt không hợp lệ.");
    return res.redirect("/admin/bookings");
  }

  try {
    let query;
    let params;

    if (action === "approve") {
      query = `UPDATE ${config.table}
               SET ${config.bookingStatus} = 'DaXacNhan'
               WHERE ${config.id} = ? AND ${config.bookingStatus} = 'ChoXacNhan'`;
      params = [id];
    } else if (action === "reject") {
      query = `UPDATE ${config.table}
               SET ${config.bookingStatus} = 'TuChoi'
               WHERE ${config.id} = ? AND ${config.bookingStatus} = 'ChoXacNhan'`;
      params = [id];
    } else {
      query = `UPDATE ${config.table}
               SET ${config.paymentStatus} = 'DaThanhToan'
               WHERE ${config.id} = ?
                 AND ${config.bookingStatus} = 'DaXacNhan'
                 AND ${config.paymentMethod} = 'TienMat'
                 AND ${config.paymentStatus} = 'ChuaThanhToan'`;
      params = [id];
    }

    const [result] = await db.query(query, params);
    if (!result.affectedRows) {
      req.flash("error", "Lịch không còn ở trạng thái phù hợp để cập nhật.");
      return res.redirect("/admin/bookings");
    }

    req.flash(
      "success",
      action === "approve"
        ? "Đã xác nhận lịch đặt."
        : action === "reject"
          ? "Đã từ chối lịch đặt."
          : "Đã ghi nhận khách thanh toán trực tiếp.",
    );
    return res.redirect("/admin/bookings");
  } catch (error) {
    console.error("Lỗi cập nhật lịch đặt:", error.message);
    req.flash("error", "Không thể cập nhật lịch đặt.");
    return res.redirect("/admin/bookings");
  }
}

module.exports.approve = (req, res) => updateBooking(req, res, "approve");
module.exports.reject = (req, res) => updateBooking(req, res, "reject");
module.exports.markCashPaid = (req, res) => updateBooking(req, res, "cash");