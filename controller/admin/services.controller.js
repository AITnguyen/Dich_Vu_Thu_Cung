const db = require("../../config/database");
const dichVuModel = require("../../models/DICH_VU.model");

const PAGE_SIZE = 5;

function getFlashMessages(req) {
  const successMessages = req.flash("success");
  const errorMessages = req.flash("error");

  return {
    successMessage: successMessages[0] || "",
    errorMessage: errorMessages[0] || "",
  };
}

function validateServiceForm(body) {
  const title = String(body.title || "").trim();
  const rawPrice = String(body.price ?? "").trim();
  const price = Number(rawPrice);
  const status = body.status || "active";
  const description = String(body.description || "").trim();

  if (!title) {
    return { error: "Vui lòng nhập tên dịch vụ." };
  }

  if (title.length > 255) {
    return { error: "Tên dịch vụ không được dài quá 255 ký tự." };
  }

  if (!rawPrice || !Number.isFinite(price) || price < 0) {
    return { error: "Giá dịch vụ phải là số hợp lệ và không âm." };
  }

  if (!["active", "inactive"].includes(status)) {
    return { error: "Trạng thái dịch vụ không hợp lệ." };
  }

  return {
    values: {
      title,
      price,
      status,
      description,
    },
  };
}

// [GET] /admin/services
module.exports.index = async (req, res) => {
  try {
    const allowedStatuses = ["active", "inactive"];
    const currentStatus = allowedStatuses.includes(req.query.status)
      ? req.query.status
      : "";

    const countParams = [];
    let countQuery = "SELECT COUNT(*) AS total FROM DICH_VU WHERE 1=1";

    if (currentStatus) {
      countQuery += " AND DV_TRANGTHAI = ?";
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
    let query = "SELECT * FROM DICH_VU WHERE 1=1";

    if (currentStatus) {
      query += " AND DV_TRANGTHAI = ?";
      queryParams.push(currentStatus);
    }

    query += " ORDER BY DV_ID DESC LIMIT ? OFFSET ?";
    queryParams.push(PAGE_SIZE, skip);

    const [rows] = await db.query(query, queryParams);

    const services = rows.map((item) => ({
      id: item.DV_ID,
      title: item.DV_TEN,
      price: `${Number(item.DV_GIA || 0).toLocaleString("vi-VN")}đ`,
      description: item.DV_MOTA,
      thumbnail: item.DV_ANH || "/image/thumbnail.jpg",
      status: item.DV_TRANGTHAI,
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

    res.render("admin/pages/services/index", {
      pageTitle: "Quản lý Dịch vụ Thú cưng",
      path: "/services",
      services,
      filterStatus,
      pagination: { currentPage, totalPage },
      ...getFlashMessages(req),
    });
  } catch (error) {
    console.log("Lỗi lấy danh sách dịch vụ:", error);
    res.redirect("/admin/dashboard");
  }
};

// [GET] /admin/services/create
module.exports.create = (req, res) => {
  res.render("admin/pages/services/create", {
    pageTitle: "Thêm dịch vụ",
    path: "/services",
    ...getFlashMessages(req),
  });
};

// [POST] /admin/services/create
module.exports.createPost = async (req, res) => {
  try {
    const validation = validateServiceForm(req.body);

    if (validation.error) {
      req.flash("error", validation.error);
      return res.redirect("/admin/services/create");
    }

    const { title, price, status, description } = validation.values;
    const thumbnail = req.body.thumbnail || "";

    await db.query(
      `INSERT INTO DICH_VU
        (DV_TEN, DV_GIA, DV_TRANGTHAI, DV_MOTA, DV_ANH, DV_NGAYTAO)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [title, price, status, description, thumbnail],
    );

    req.flash("success", "Thêm dịch vụ thành công.");
    res.redirect("/admin/services");
  } catch (error) {
    console.log("Lỗi thêm dịch vụ:", error);
    req.flash("error", "Thêm dịch vụ thất bại.");
    res.redirect("/admin/services/create");
  }
};

// [GET] /admin/services/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      req.flash("error", "Mã dịch vụ không hợp lệ.");
      return res.redirect("/admin/services");
    }

    const [rows] = await db.query("SELECT * FROM DICH_VU WHERE DV_ID = ?", [
      id,
    ]);

    if (rows.length === 0) {
      req.flash("error", "Không tìm thấy dịch vụ.");
      return res.redirect("/admin/services");
    }

    const service = rows[0];
    const formattedPrice = `${Number(service.DV_GIA || 0).toLocaleString("vi-VN")}đ`;

    res.render("admin/pages/services/detail", {
      pageTitle: `Chi tiết dịch vụ: ${service.DV_TEN}`,
      path: "/services",
      service,
      formattedPrice,
      ...getFlashMessages(req),
    });
  } catch (error) {
    console.log("Lỗi lấy chi tiết dịch vụ:", error);
    req.flash("error", "Không thể tải chi tiết dịch vụ.");
    res.redirect("/admin/services");
  }
};

// [GET] /admin/services/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      req.flash("error", "Mã dịch vụ không hợp lệ.");
      return res.redirect("/admin/services");
    }

    const [rows] = await db.query("SELECT * FROM DICH_VU WHERE DV_ID = ?", [
      id,
    ]);

    if (rows.length === 0) {
      req.flash("error", "Không tìm thấy dịch vụ cần sửa.");
      return res.redirect("/admin/services");
    }

    res.render("admin/pages/services/edit", {
      pageTitle: "Chỉnh sửa dịch vụ",
      path: "/services",
      service: rows[0],
      ...getFlashMessages(req),
    });
  } catch (error) {
    console.log("Lỗi lấy thông tin dịch vụ:", error);
    req.flash("error", "Không thể tải thông tin dịch vụ.");
    res.redirect("/admin/services");
  }
};

// [POST] /admin/services/edit/:id
module.exports.editPatch = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    req.flash("error", "Mã dịch vụ không hợp lệ.");
    return res.redirect("/admin/services");
  }

  try {
    const validation = validateServiceForm(req.body);

    if (validation.error) {
      req.flash("error", validation.error);
      return res.redirect(`/admin/services/edit/${id}`);
    }

    const [rows] = await db.query(
      "SELECT DV_ANH FROM DICH_VU WHERE DV_ID = ?",
      [id],
    );

    if (rows.length === 0) {
      req.flash("error", "Không tìm thấy dịch vụ cần sửa.");
      return res.redirect("/admin/services");
    }

    const { title, price, status, description } = validation.values;
    const thumbnail = req.body.thumbnail || rows[0].DV_ANH || "";

    await db.query(
      `UPDATE DICH_VU
       SET DV_TEN = ?, DV_GIA = ?, DV_TRANGTHAI = ?,
           DV_MOTA = ?, DV_ANH = ?
       WHERE DV_ID = ?`,
      [title, price, status, description, thumbnail, id],
    );

    req.flash("success", "Cập nhật dịch vụ thành công.");
    res.redirect("/admin/services");
  } catch (error) {
    console.log("Lỗi cập nhật dịch vụ:", error);
    req.flash("error", "Cập nhật dịch vụ thất bại.");
    res.redirect(`/admin/services/edit/${id}`);
  }
};

// [POST] /admin/services/delete/:id
module.exports.deleteItem = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      req.flash("error", "Mã dịch vụ không hợp lệ.");
      return res.redirect("/admin/services");
    }

    const [serviceRows] = await db.query(
      "SELECT DV_ID FROM DICH_VU WHERE DV_ID = ?",
      [id],
    );

    if (serviceRows.length === 0) {
      req.flash("error", "Không tìm thấy dịch vụ cần xóa.");
      return res.redirect("/admin/services");
    }

    const [usageRows] = await db.query(
      "SELECT COUNT(*) AS total FROM SU_DUNG_DICH_VU WHERE DV_ID = ?",
      [id],
    );

    if (Number(usageRows[0]?.total || 0) > 0) {
      req.flash(
        "error",
        "Không thể xóa dịch vụ đã có lịch sử sử dụng. Hãy chuyển dịch vụ sang trạng thái dừng hoạt động.",
      );
      return res.redirect("/admin/services");
    }

    const result = await dichVuModel.DELETE(id);

    if (!result.affectedRows) {
      req.flash(
        "error",
        "Không thể xóa dịch vụ. Có thể dịch vụ vừa được sử dụng.",
      );
      return res.redirect("/admin/services");
    }

    req.flash("success", "Xóa dịch vụ thành công.");
    res.redirect("/admin/services");
  } catch (error) {
    console.log("Lỗi xóa dịch vụ:", error);
    req.flash("error", "Xóa dịch vụ thất bại.");
    res.redirect("/admin/services");
  }
};
