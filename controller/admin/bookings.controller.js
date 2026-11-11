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

module.exports.detail = async (req, res) => {
  const type = req.params.type;
  const id = Number(req.params.id);

  if (!TABLES[type] || !Number.isInteger(id) || id <= 0) {
    req.flash("error", "Lịch đặt không hợp lệ.");
    return res.redirect("/admin/bookings");
  }

  try {
    let query;

    if (type === "services") {
      query = `
        SELECT
          s.SDDV_ID AS id,
          s.SDDV_SOLUONG AS quantity,
          DATE_FORMAT(s.SDDV_NGAYSUDUNG, '%d/%m/%Y %H:%i') AS startAt,
          s.SDDV_THANHTIEN AS amount,
          s.SDDV_TRANGTHAI_DAT AS bookingStatus,
          s.SDDV_PHUONGTHUCTT AS paymentMethod,
          s.SDDV_THANHTOAN AS paymentStatus,
          s.SDDV_MAKHOAN AS paymentCode,
          c.KH_HOTEN AS customerName,
          c.KH_EMAIL AS customerEmail,
          c.KH_SDT AS customerPhone,
          c.KH_DIACHI AS customerAddress,
          c.KH_CCCD AS customerCccd,
          p.TN_TEN AS petName,
          p.TN_TUOI AS petAge,
          p.TN_CANNANG AS petWeight,
          p.TN_GHICHU AS petNote,
          g.GIONG_TEN AS petBreed,
          g.GIONG_LOAI AS petSpecies,
          d.DV_TEN AS itemName,
          d.DV_GIA AS unitPrice,
          d.DV_MOTA AS itemDescription,
          d.DV_ANH AS itemImage,
          d.DV_TRANGTHAI AS itemStatus,
          n.NV_HOTEN AS staffName,
          'services' AS type
        FROM SU_DUNG_DICH_VU s
        JOIN THU_NUOI p ON p.TN_ID = s.TN_ID
        LEFT JOIN GIONG g ON g.GIONG_ID = p.GIONG_ID
        JOIN KHACH_HANG c ON c.KH_ID = p.KH_ID
        JOIN DICH_VU d ON d.DV_ID = s.DV_ID
        LEFT JOIN NHAN_VIEN n ON n.NV_ID = s.NV_ID
        WHERE s.SDDV_ID = ?
        LIMIT 1
      `;
    } else {
      query = `
        SELECT
          s.SDP_ID AS id,
          DATE_FORMAT(s.SDP_NGAYNHAN, '%d/%m/%Y') AS startAt,
          DATE_FORMAT(s.SDP_NGAYTRA, '%d/%m/%Y') AS endAt,
          GREATEST(DATEDIFF(s.SDP_NGAYTRA, s.SDP_NGAYNHAN), 1) AS dayCount,
          s.SDP_TONGTIEN AS amount,
          s.SDP_TRANGTHAI AS stayStatus,
          s.SDP_TRANGTHAI_DAT AS bookingStatus,
          s.SDP_PHUONGTHUCTT AS paymentMethod,
          s.SDP_THANHTOAN AS paymentStatus,
          s.SDP_MAKHOAN AS paymentCode,
          c.KH_HOTEN AS customerName,
          c.KH_EMAIL AS customerEmail,
          c.KH_SDT AS customerPhone,
          c.KH_DIACHI AS customerAddress,
          c.KH_CCCD AS customerCccd,
          p.TN_TEN AS petName,
          p.TN_TUOI AS petAge,
          p.TN_CANNANG AS petWeight,
          p.TN_GHICHU AS petNote,
          g.GIONG_TEN AS petBreed,
          g.GIONG_LOAI AS petSpecies,
          r.PHONG_TEN AS itemName,
          r.PHONG_GIANGAY AS unitPrice,
          r.PHONG_SL AS capacity,
          r.PHONG_MOTA AS itemDescription,
          r.PHONG_ANH AS itemImage,
          r.PHONG_TRANGTHAI AS itemStatus,
          'rooms' AS type
        FROM SU_DUNG_PHONG s
        JOIN THU_NUOI p ON p.TN_ID = s.TN_ID
        LEFT JOIN GIONG g ON g.GIONG_ID = p.GIONG_ID
        JOIN KHACH_HANG c ON c.KH_ID = p.KH_ID
        JOIN PHONG r ON r.PHONG_ID = s.PHONG_ID
        WHERE s.SDP_ID = ?
        LIMIT 1
      `;
    }

    const [rows] = await db.query(query, [id]);
    const booking = rows[0];

    if (!booking) {
      req.flash("error", "Không tìm thấy lịch đặt.");
      return res.redirect("/admin/bookings");
    }

    booking.amountText = `${Number(booking.amount || 0).toLocaleString("vi-VN")}đ`;
    booking.unitPriceText = `${Number(booking.unitPrice || 0).toLocaleString("vi-VN")}đ`;

    return res.render("admin/pages/bookings/detail", {
      pageTitle: "Chi tiết lịch đặt",
      path: "/bookings",
      booking,
    });
  } catch (error) {
    console.error("Lỗi tải chi tiết lịch đặt:", error.message);
    req.flash("error", "Không thể tải chi tiết lịch đặt.");
    return res.redirect("/admin/bookings");
  }
};

module.exports.approve = (req, res) => updateBooking(req, res, "approve");
module.exports.reject = (req, res) => updateBooking(req, res, "reject");
module.exports.markCashPaid = (req, res) => updateBooking(req, res, "cash");
