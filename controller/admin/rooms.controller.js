const db = require("../../config/database");
const phongModel = require("../../models/PHONG_LUU_TRU.model");

const PAGE_SIZE = 5;

function getFlashMessages(req) {
  const successMessages = req.flash("success");
  const errorMessages = req.flash("error");

  return {
    successMessage: successMessages[0] || "",
    errorMessage: errorMessages[0] || "",
  };
}

function validateRoomForm(body) {
  const title = String(body.title || "").trim();
  const capacity = Number(body.capacity);
  const rawPrice = String(body.price || "").trim();
  const price = Number(rawPrice);
  const status = body.status || "active";
  const description = String(body.description || "").trim();

  if (!title) {
    return { error: "Vui lòng nhập tên phòng." };
  }

  if (title.length > 100) {
    return { error: "Tên phòng không được dài quá 100 ký tự." };
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    return { error: "Sức chứa phải là số nguyên lớn hơn 0." };
  }

  if (!rawPrice || !Number.isFinite(price) || price < 0) {
    return { error: "Giá phòng phải là số hợp lệ và không âm." };
  }

  if (!["active", "inactive"].includes(status)) {
    return { error: "Trạng thái phòng không hợp lệ." };
  }

  return {
    values: {
      title,
      capacity,
      price,
      status,
      description,
    },
  };
}

// [GET] /admin/rooms
module.exports.index = async (req, res) => {
  try {
    const allowedStatuses = ["active", "inactive"];
    const currentStatus = allowedStatuses.includes(req.query.status)
      ? req.query.status
      : "";

    const countParams = [];
    let countQuery = "SELECT COUNT(*) AS total FROM PHONG WHERE 1=1";

    if (currentStatus) {
      countQuery += " AND PHONG_TRANGTHAI = ?";
      countParams.push(currentStatus);
    }

    const [countRows] = await db.query(countQuery, countParams);
    const totalRecords = Number(countRows[0]?.total || 0);
    const totalPage = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

    const requestedPage = Number.parseInt(req.query.page, 10);
    let currentPage =
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    currentPage = Math.min(currentPage, totalPage);
    const skip = (currentPage - 1) * PAGE_SIZE;

    const queryParams = [];
    let query = "SELECT * FROM PHONG WHERE 1=1";

    if (currentStatus) {
      query += " AND PHONG_TRANGTHAI = ?";
      queryParams.push(currentStatus);
    }

    query += " ORDER BY PHONG_ID DESC LIMIT ? OFFSET ?";
    queryParams.push(PAGE_SIZE, skip);

    const [rows] = await db.query(query, queryParams);

    const rooms = rows.map((item) => ({
      id: item.PHONG_ID,
      name: item.PHONG_TEN,
      capacity: item.PHONG_SL,
      price: `${Number(item.PHONG_GIANGAY || 0).toLocaleString("vi-VN")}đ`,
      status: item.PHONG_TRANGTHAI,
      description: item.PHONG_MOTA,
      thumbnail: item.PHONG_ANH || "/image/thumbnail.jpg",
      createdAt: item.PHONG_NGAYTAO,
    }));

    const filterStatus = [
      { name: "Tất cả", value: "", selected: currentStatus === "" },
      {
        name: "Hoạt động",
        value: "active",
        selected: currentStatus === "active",
      },
      {
        name: "Dừng hoạt động",
        value: "inactive",
        selected: currentStatus === "inactive",
      },
    ];

    res.render("admin/pages/rooms/index", {
      pageTitle: "Quản lý Phòng lưu trú",
      path: "/rooms",
      rooms,
      filterStatus,
      pagination: { currentPage, totalPage },
      ...getFlashMessages(req),
    });
  } catch (error) {
    console.log("Lỗi lấy danh sách phòng lưu trú:", error);
    res.redirect("/admin/dashboard");
  }
};

// [GET] /admin/rooms/create
module.exports.create = (req, res) => {
  res.render("admin/pages/rooms/create", {
    pageTitle: "Thêm phòng lưu trú",
    path: "/rooms",
    ...getFlashMessages(req),
  });
};

// [POST] /admin/rooms/create
module.exports.createPost = async (req, res) => {
  try {
    const validation = validateRoomForm(req.body);

    if (validation.error) {
      req.flash("error", validation.error);
      return res.redirect("/admin/rooms/create");
    }

    const { title, capacity, price, status, description } = validation.values;
    const thumbnail = req.body.thumbnail || "";

    await db.query(
      `INSERT INTO PHONG
        (PHONG_TEN, PHONG_SL, PHONG_GIANGAY, PHONG_TRANGTHAI,
         PHONG_MOTA, PHONG_ANH, PHONG_NGAYTAO)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [title, capacity, price, status, description, thumbnail],
    );

    req.flash("success", "Thêm phòng lưu trú thành công.");
    res.redirect("/admin/rooms");
  } catch (error) {
    console.log("Lỗi thêm phòng lưu trú:", error);
    req.flash("error", "Thêm phòng lưu trú thất bại.");
    res.redirect("/admin/rooms/create");
  }
};

// [GET] /admin/rooms/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      req.flash("error", "Mã phòng không hợp lệ.");
      return res.redirect("/admin/rooms");
    }

    const [rows] = await db.query("SELECT * FROM PHONG WHERE PHONG_ID = ?", [
      id,
    ]);

    if (rows.length === 0) {
      req.flash("error", "Không tìm thấy phòng cần sửa.");
      return res.redirect("/admin/rooms");
    }

    res.render("admin/pages/rooms/edit", {
      pageTitle: "Chỉnh sửa phòng lưu trú",
      path: "/rooms",
      room: rows[0],
      ...getFlashMessages(req),
    });
  } catch (error) {
    console.log("Lỗi lấy thông tin phòng:", error);
    req.flash("error", "Không thể tải thông tin phòng.");
    res.redirect("/admin/rooms");
  }
};

// [POST] /admin/rooms/edit/:id
module.exports.editPatch = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    req.flash("error", "Mã phòng không hợp lệ.");
    return res.redirect("/admin/rooms");
  }

  try {
    const validation = validateRoomForm(req.body);

    if (validation.error) {
      req.flash("error", validation.error);
      return res.redirect(`/admin/rooms/edit/${id}`);
    }

    const [rows] = await db.query(
      "SELECT PHONG_ANH FROM PHONG WHERE PHONG_ID = ?",
      [id],
    );

    if (rows.length === 0) {
      req.flash("error", "Không tìm thấy phòng cần sửa.");
      return res.redirect("/admin/rooms");
    }

    const { title, capacity, price, status, description } = validation.values;
    const thumbnail = req.body.thumbnail || rows[0].PHONG_ANH || "";

    await db.query(
      `UPDATE PHONG
       SET PHONG_TEN = ?, PHONG_SL = ?, PHONG_GIANGAY = ?,
           PHONG_TRANGTHAI = ?, PHONG_MOTA = ?, PHONG_ANH = ?
       WHERE PHONG_ID = ?`,
      [title, capacity, price, status, description, thumbnail, id],
    );

    req.flash("success", "Cập nhật phòng lưu trú thành công.");
    res.redirect("/admin/rooms");
  } catch (error) {
    console.log("Lỗi cập nhật phòng lưu trú:", error);
    req.flash("error", "Cập nhật phòng lưu trú thất bại.");
    res.redirect(`/admin/rooms/edit/${id}`);
  }
};

// [POST] /admin/rooms/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      req.flash("error", "Mã phòng không hợp lệ.");
      return res.redirect("/admin/rooms");
    }

    const [roomRows] = await db.query(
      "SELECT PHONG_ID FROM PHONG WHERE PHONG_ID = ?",
      [id],
    );

    if (roomRows.length === 0) {
      req.flash("error", "Không tìm thấy phòng cần xóa.");
      return res.redirect("/admin/rooms");
    }

    const [usageRows] = await db.query(
      "SELECT COUNT(*) AS total FROM SU_DUNG_PHONG WHERE PHONG_ID = ?",
      [id],
    );

    if (Number(usageRows[0]?.total || 0) > 0) {
      req.flash(
        "error",
        "Không thể xóa phòng đã có lịch lưu trú. Bạn có thể chuyển phòng sang trạng thái dừng hoạt động.",
      );
      return res.redirect("/admin/rooms");
    }

    const result = await phongModel.DELETE(id);

    if (!result.affectedRows) {
      req.flash(
        "error",
        "Không thể xóa phòng. Có thể phòng vừa được thêm vào một lịch lưu trú.",
      );
      return res.redirect("/admin/rooms");
    }

    req.flash("success", "Xóa phòng lưu trú thành công.");
    res.redirect("/admin/rooms");
  } catch (error) {
    console.log("Lỗi xóa phòng lưu trú:", error);
    req.flash("error", "Xóa phòng lưu trú thất bại.");
    res.redirect("/admin/rooms");
  }
};

// [GET] /admin/rooms/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      req.flash("error", "Mã phòng không hợp lệ.");
      return res.redirect("/admin/rooms");
    }

    const [rows] = await db.query("SELECT * FROM PHONG WHERE PHONG_ID = ?", [
      id,
    ]);

    if (rows.length === 0) {
      req.flash("error", "Không tìm thấy phòng lưu trú.");
      return res.redirect("/admin/rooms");
    }

    const room = rows[0];
    const formattedPrice = `${Number(room.PHONG_GIANGAY || 0).toLocaleString("vi-VN")}đ`;

    res.render("admin/pages/rooms/detail", {
      pageTitle: `Chi tiết phòng: ${room.PHONG_TEN}`,
      path: "/rooms",
      room,
      formattedPrice,
      ...getFlashMessages(req),
    });
  } catch (error) {
    console.log("Lỗi lấy chi tiết phòng lưu trú:", error);
    req.flash("error", "Không thể tải chi tiết phòng.");
    res.redirect("/admin/rooms");
  }
};
