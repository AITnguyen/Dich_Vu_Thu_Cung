const crypto = require("crypto");
const db = require("../../config/database");
const sepay = require("../../helper/sepay.helper");

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const SERVICE_STATUS = {
  table: "SU_DUNG_DICH_VU",
  id: "SDDV_ID",
  petId: "TN_ID",
  date: "SDDV_NGAYSUDUNG",
  amount: "SDDV_THANHTIEN",
  bookingStatus: "SDDV_TRANGTHAI_DAT",
  paymentMethod: "SDDV_PHUONGTHUCTT",
  paymentStatus: "SDDV_THANHTOAN",
  invoice: "SDDV_MAKHOAN",
  prefix: "DV",
};

const ROOM_STATUS = {
  table: "SU_DUNG_PHONG",
  id: "SDP_ID",
  petId: "TN_ID",
  date: "SDP_NGAYNHAN",
  endDate: "SDP_NGAYTRA",
  amount: "SDP_TONGTIEN",
  bookingStatus: "SDP_TRANGTHAI_DAT",
  paymentMethod: "SDP_PHUONGTHUCTT",
  paymentStatus: "SDP_THANHTOAN",
  invoice: "SDP_MAKHOAN",
  prefix: "PH",
};

function positiveId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function localToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateText, days) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function pageMessages(req) {
  return {
    errorMessage: req.flash("error")[0] || "",
    successMessage: req.flash("success")[0] || "",
  };
}

async function loadPets(customerId) {
  const [pets] = await db.query(
    `SELECT TN_ID, TN_TEN
     FROM THU_NUOI
     WHERE KH_ID = ?
     ORDER BY TN_ID DESC`,
    [customerId],
  );

  return pets.map((pet) => ({ id: pet.TN_ID, name: pet.TN_TEN }));
}

module.exports.serviceForm = async (req, res) => {
  try {
    const serviceId = positiveId(req.params.id);
    if (!serviceId) {
      req.flash("error", "Mã dịch vụ không hợp lệ.");
      return res.redirect("/services");
    }

    const [rows] = await db.query(
      `SELECT DV_ID, DV_TEN, DV_GIA
       FROM DICH_VU
       WHERE DV_ID = ? AND DV_TRANGTHAI = 'active'`,
      [serviceId],
    );

    if (!rows.length) {
      req.flash("error", "Dịch vụ không tồn tại hoặc đã dừng hoạt động.");
      return res.redirect("/services");
    }

    res.render("client/pages/booking/service", {
      pageTitle: "Đặt lịch dịch vụ",
      service: rows[0],
      price: Number(rows[0].DV_GIA).toLocaleString("vi-VN"),
      pets: await loadPets(req.authUser.KH_ID),
      timeSlots: TIME_SLOTS,
      today: localToday(),
      ...pageMessages(req),
    });
  } catch (error) {
    console.error("Lỗi tải form đặt dịch vụ:", error.message);
    req.flash("error", "Không thể tải form đặt lịch.");
    res.redirect("/services");
  }
};

module.exports.servicePost = async (req, res) => {
  const serviceId = positiveId(req.params.id);
  const petId = positiveId(req.body.petId);
  const date = String(req.body.date || "");
  const time = String(req.body.time || "");
  const paymentMethod = String(req.body.paymentMethod || "");

  if (!serviceId || !petId || !isIsoDate(date) || date < localToday()) {
    req.flash("error", "Vui lòng chọn thú cưng và ngày hẹn hợp lệ.");
    return res.redirect(`/booking/services/${req.params.id}`);
  }

  if (!TIME_SLOTS.includes(time)) {
    req.flash("error", "Khung giờ hẹn không hợp lệ.");
    return res.redirect(`/booking/services/${serviceId}`);
  }

  if (!["TienMat", "SePay"].includes(paymentMethod)) {
    req.flash("error", "Vui lòng chọn cách thanh toán.");
    return res.redirect(`/booking/services/${serviceId}`);
  }

  if (date === localToday()) {
    const now = new Date();
    const currentTime =
      `${String(now.getHours()).padStart(2, "0")}:` +
      String(now.getMinutes()).padStart(2, "0");

    if (time <= currentTime) {
      req.flash("error", "Khung giờ đã qua. Vui lòng chọn giờ khác.");
      return res.redirect(`/booking/services/${serviceId}`);
    }
  }

  try {
    const [petRows] = await db.query(
      "SELECT TN_ID FROM THU_NUOI WHERE TN_ID = ? AND KH_ID = ?",
      [petId, req.authUser.KH_ID],
    );

    const [serviceRows] = await db.query(
      `SELECT DV_ID, DV_GIA
       FROM DICH_VU
       WHERE DV_ID = ? AND DV_TRANGTHAI = 'active'`,
      [serviceId],
    );

    if (!petRows.length || !serviceRows.length) {
      req.flash("error", "Thú cưng hoặc dịch vụ không hợp lệ.");
      return res.redirect(`/booking/services/${serviceId}`);
    }

    const amount = Number(serviceRows[0].DV_GIA);
    if (!Number.isFinite(amount) || amount <= 0) {
      req.flash("error", "Giá dịch vụ hiện không hợp lệ.");
      return res.redirect("/services");
    }

    const appointmentAt = `${date} ${time}:00`;

    await db.query(
      `INSERT INTO SU_DUNG_DICH_VU
        (TN_ID, DV_ID, NV_ID, SDDV_SOLUONG, SDDV_NGAYSUDUNG,
         SDDV_THANHTIEN, SDDV_TRANGTHAI_DAT, SDDV_PHUONGTHUCTT,
         SDDV_THANHTOAN)
       VALUES (?, ?, NULL, 1, ?, ?, 'ChoXacNhan', ?, 'ChuaThanhToan')`,
      [petId, serviceId, appointmentAt, amount, paymentMethod],
    );

    req.flash(
      "success",
      "Đã gửi yêu cầu đặt dịch vụ. Lịch sẽ chờ quản trị viên xác nhận.",
    );
    return res.redirect("/booking/history");
  } catch (error) {
    console.error("Lỗi tạo lịch dịch vụ:", error.message);
    req.flash("error", "Không thể tạo lịch dịch vụ. Hãy thử lại.");
    return res.redirect(`/booking/services/${serviceId}`);
  }
};

module.exports.roomForm = async (req, res) => {
  try {
    const roomId = positiveId(req.params.id);
    if (!roomId) {
      req.flash("error", "Mã phòng không hợp lệ.");
      return res.redirect("/rooms");
    }

    const [rows] = await db.query(
      `SELECT PHONG_ID, PHONG_TEN, PHONG_SL, PHONG_GIANGAY
       FROM PHONG
       WHERE PHONG_ID = ? AND PHONG_TRANGTHAI = 'active'`,
      [roomId],
    );

    if (!rows.length) {
      req.flash("error", "Phòng không tồn tại hoặc đã dừng hoạt động.");
      return res.redirect("/rooms");
    }

    res.render("client/pages/booking/room", {
      pageTitle: "Đặt phòng lưu trú",
      room: rows[0],
      price: Number(rows[0].PHONG_GIANGAY).toLocaleString("vi-VN"),
      pets: await loadPets(req.authUser.KH_ID),
      today: localToday(),
      ...pageMessages(req),
    });
  } catch (error) {
    console.error("Lỗi tải form đặt phòng:", error.message);
    req.flash("error", "Không thể tải form đặt phòng.");
    res.redirect("/rooms");
  }
};

module.exports.roomPost = async (req, res) => {
  const roomId = positiveId(req.params.id);
  const petId = positiveId(req.body.petId);
  const checkIn = String(req.body.checkIn || "");
  const days = Number(req.body.days);
  const paymentMethod = String(req.body.paymentMethod || "");

  if (
    !roomId ||
    !petId ||
    !isIsoDate(checkIn) ||
    checkIn < localToday() ||
    !Number.isInteger(days) ||
    days < 1
  ) {
    req.flash("error", "Vui lòng nhập thú cưng, ngày nhận và số ngày hợp lệ.");
    return res.redirect(`/booking/rooms/${req.params.id}`);
  }

  if (!["TienMat", "SePay"].includes(paymentMethod)) {
    req.flash("error", "Vui lòng chọn cách thanh toán.");
    return res.redirect(`/booking/rooms/${roomId}`);
  }

  const checkOut = addDays(checkIn, days);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [roomRows] = await connection.query(
      `SELECT PHONG_ID, PHONG_SL, PHONG_GIANGAY
       FROM PHONG
       WHERE PHONG_ID = ? AND PHONG_TRANGTHAI = 'active'
       FOR UPDATE`,
      [roomId],
    );

    const [petRows] = await connection.query(
      "SELECT TN_ID FROM THU_NUOI WHERE TN_ID = ? AND KH_ID = ?",
      [petId, req.authUser.KH_ID],
    );

    if (!roomRows.length || !petRows.length) {
      throw new Error("Phòng hoặc thú cưng không hợp lệ.");
    }

    const [overlapRows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM SU_DUNG_PHONG
       WHERE PHONG_ID = ?
         AND SDP_NGAYNHAN < ?
         AND SDP_NGAYTRA > ?
         AND COALESCE(SDP_TRANGTHAI_DAT, 'DaXacNhan')
             NOT IN ('TuChoi', 'DaHuy', 'Huy')`,
      [roomId, `${checkOut} 00:00:00`, `${checkIn} 00:00:00`],
    );

    if (Number(overlapRows[0].total) >= Number(roomRows[0].PHONG_SL)) {
      throw new Error("Phòng đã hết chỗ trong khoảng ngày bạn chọn.");
    }

    const [petOverlapRows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM SU_DUNG_PHONG
       WHERE TN_ID = ?
         AND SDP_NGAYNHAN < ?
         AND SDP_NGAYTRA > ?
         AND COALESCE(SDP_TRANGTHAI_DAT, 'DaXacNhan')
             NOT IN ('TuChoi', 'DaHuy', 'Huy')`,
      [petId, `${checkOut} 00:00:00`, `${checkIn} 00:00:00`],
    );

    if (Number(petOverlapRows[0].total) > 0) {
      throw new Error("Thú cưng đã có lịch lưu trú trùng ngày.");
    }

    const total = Math.round(Number(roomRows[0].PHONG_GIANGAY) * days);
    if (!Number.isSafeInteger(total) || total <= 0) {
      throw new Error("Tổng tiền phòng không hợp lệ.");
    }

    await connection.query(
      `INSERT INTO SU_DUNG_PHONG
        (TN_ID, PHONG_ID, SDP_NGAYNHAN, SDP_NGAYTRA, SDP_TONGTIEN,
         SDP_TRANGTHAI, SDP_TRANGTHAI_DAT, SDP_PHUONGTHUCTT,
         SDP_THANHTOAN)
       VALUES (?, ?, ?, ?, ?, NULL, 'ChoXacNhan', ?, 'ChuaThanhToan')`,
      [
        petId,
        roomId,
        `${checkIn} 00:00:00`,
        `${checkOut} 00:00:00`,
        total,
        paymentMethod,
      ],
    );

    await connection.commit();
    req.flash(
      "success",
      "Đã gửi yêu cầu đặt phòng. Lịch sẽ chờ quản trị viên xác nhận.",
    );
    return res.redirect("/booking/history");
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi tạo lịch phòng:", error.message);
    req.flash("error", error.message || "Không thể tạo lịch phòng.");
    return res.redirect(`/booking/rooms/${roomId}`);
  } finally {
    connection.release();
  }
};

module.exports.history = async (req, res) => {
  try {
    const customerId = req.authUser.KH_ID;

    const [rows] = await db.query(
      `SELECT * FROM (
         SELECT
           'service' AS kind,
           s.SDDV_ID AS id,
           d.DV_TEN AS itemName,
           p.TN_TEN AS petName,
           DATE_FORMAT(s.SDDV_NGAYSUDUNG, '%Y-%m-%d %H:%i') AS dateText,
           NULL AS endDateText,
           s.SDDV_THANHTIEN AS amount,
           s.SDDV_TRANGTHAI_DAT AS bookingStatus,
           s.SDDV_PHUONGTHUCTT AS paymentMethod,
           s.SDDV_THANHTOAN AS paymentStatus,
           s.SDDV_NGAYSUDUNG AS sortDate
         FROM SU_DUNG_DICH_VU s
         JOIN THU_NUOI p ON p.TN_ID = s.TN_ID
         JOIN DICH_VU d ON d.DV_ID = s.DV_ID
         WHERE p.KH_ID = ?

         UNION ALL

         SELECT
           'room' AS kind,
           s.SDP_ID AS id,
           r.PHONG_TEN AS itemName,
           p.TN_TEN AS petName,
           DATE_FORMAT(s.SDP_NGAYNHAN, '%Y-%m-%d') AS dateText,
           DATE_FORMAT(s.SDP_NGAYTRA, '%Y-%m-%d') AS endDateText,
           s.SDP_TONGTIEN AS amount,
           s.SDP_TRANGTHAI_DAT AS bookingStatus,
           s.SDP_PHUONGTHUCTT AS paymentMethod,
           s.SDP_THANHTOAN AS paymentStatus,
           s.SDP_NGAYNHAN AS sortDate
         FROM SU_DUNG_PHONG s
         JOIN THU_NUOI p ON p.TN_ID = s.TN_ID
         JOIN PHONG r ON r.PHONG_ID = s.PHONG_ID
         WHERE p.KH_ID = ?
       ) AS bookings
       ORDER BY sortDate DESC`,
      [customerId, customerId],
    );

    const bookings = rows.map((item) => ({
      ...item,
      amountText: `${Number(item.amount || 0).toLocaleString("vi-VN")}đ`,
    }));

    res.render("client/pages/booking/history", {
      pageTitle: "Lịch đặt của tôi",
      bookings,
      ...pageMessages(req),
    });
  } catch (error) {
    console.error("Lỗi tải lịch đặt:", error.message);
    req.flash("error", "Không thể tải lịch đặt.");
    res.redirect("/");
  }
};

async function checkout(req, res, config) {
  const id = positiveId(req.params.id);
  if (!id) {
    req.flash("error", "Mã lịch không hợp lệ.");
    return res.redirect("/booking/history");
  }

  try {
    const [rows] = await db.query(
      `SELECT b.${config.id} AS id, b.${config.amount} AS amount,
              b.${config.invoice} AS invoice, b.${config.bookingStatus} AS bookingStatus,
              b.${config.paymentMethod} AS paymentMethod,
              b.${config.paymentStatus} AS paymentStatus
       FROM ${config.table} b
       JOIN THU_NUOI p ON p.TN_ID = b.${config.petId}
       WHERE b.${config.id} = ? AND p.KH_ID = ?
       LIMIT 1`,
      [id, req.authUser.KH_ID],
    );

    const booking = rows[0];
    if (
      !booking ||
      booking.bookingStatus !== "DaXacNhan" ||
      booking.paymentMethod !== "SePay"
    ) {
      req.flash("error", "Lịch này chưa thể thanh toán qua SePay.");
      return res.redirect("/booking/history");
    }

    if (booking.paymentStatus === "DaThanhToan") {
      req.flash("success", "Lịch này đã được thanh toán.");
      return res.redirect("/booking/history");
    }

    const invoice = booking.invoice || `${config.prefix}${booking.id}`;
    if (!booking.invoice) {
      await db.query(
        `UPDATE ${config.table}
         SET ${config.invoice} = ?
         WHERE ${config.id} = ? AND ${config.invoice} IS NULL`,
        [invoice, id],
      );
    }

    const fields = sepay.createCheckoutFields({
      amount: booking.amount,
      invoice,
      description: `PetCare ${config.prefix} ${booking.id}`,
      customerId: req.authUser.KH_ID,
    });

    res.render("client/pages/booking/sepay-checkout", {
      pageTitle: "Thanh toán SePay Sandbox",
      action: "https://pay-sandbox.sepay.vn/v1/checkout/init",
      fields,
    });
  } catch (error) {
    console.error("Lỗi tạo form SePay:", error.message);
    req.flash("error", error.message || "Không thể bắt đầu thanh toán.");
    res.redirect("/booking/history");
  }
}

module.exports.payService = (req, res) =>
  checkout(req, res, SERVICE_STATUS);

module.exports.payRoom = (req, res) =>
  checkout(req, res, ROOM_STATUS);

module.exports.paymentResult = (req, res) => {
  const result = ["success", "error", "cancel"].includes(req.query.result)
    ? req.query.result
    : "unknown";

  res.render("client/pages/booking/payment-result", {
    pageTitle: "Kết quả thanh toán",
    result,
  });
};

function hasValidIpnSecret(req) {
  const expected = Buffer.from(String(process.env.SEPAY_IPN_SECRET || ""));
  const received = Buffer.from(String(req.get("X-Secret-Key") || ""));

  return (
    expected.length > 0 &&
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

async function markPaidByInvoice(config, invoice, amount) {
  const [rows] = await db.query(
    `SELECT ${config.id} AS id, ${config.amount} AS amount
     FROM ${config.table}
     WHERE ${config.invoice} = ?
       AND ${config.bookingStatus} = 'DaXacNhan'
       AND ${config.paymentMethod} = 'SePay'
       AND ${config.paymentStatus} = 'ChuaThanhToan'
     LIMIT 1`,
    [invoice],
  );

  if (!rows.length) return;

  const expectedCents = Math.round(Number(rows[0].amount) * 100);
  const receivedCents = Math.round(Number(amount) * 100);
  if (expectedCents !== receivedCents) {
    console.error("SePay IPN: số tiền không khớp với lịch", invoice);
    return;
  }

  await db.query(
    `UPDATE ${config.table}
     SET ${config.paymentStatus} = 'DaThanhToan'
     WHERE ${config.id} = ?
       AND ${config.invoice} = ?
       AND ${config.paymentStatus} = 'ChuaThanhToan'`,
    [rows[0].id, invoice],
  );
}

module.exports.sepayIpn = async (req, res) => {
  if (!hasValidIpnSecret(req)) {
    return res.status(401).json({ error: "IPN secret không hợp lệ." });
  }

  const data = req.body || {};
  if (data.notification_type !== "ORDER_PAID") {
    return res.status(200).json({ received: true });
  }

  const order = data.order || {};
  const transaction = data.transaction || {};
  const invoice = String(order.order_invoice_number || "");

  if (
    order.order_status !== "CAPTURED" ||
    transaction.transaction_status !== "APPROVED" ||
    order.order_currency !== "VND" ||
    !invoice
  ) {
    return res.status(200).json({ received: true });
  }

  try {
    if (/^DV[1-9]\d*$/.test(invoice)) {
      await markPaidByInvoice(SERVICE_STATUS, invoice, order.order_amount);
    } else if (/^PH[1-9]\d*$/.test(invoice)) {
      await markPaidByInvoice(ROOM_STATUS, invoice, order.order_amount);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Lỗi xử lý SePay IPN:", error.message);
    return res.status(500).json({ error: "Không xử lý được IPN." });
  }
};