const db = require("../../config/database");
const dichVuModel = require("../../models/DICH_VU.model");

// [GET] /admin/services
module.exports.index = async (req, res) => {
  try {
    // 1. Lấy trạng thái từ query trên URL
    const currentStatus = req.query.status || "";

    // 2. Xử lý đếm tổng số bản ghi thỏa mãn điều kiện lọc
    let queryCountStr = "SELECT COUNT(*) as total FROM DICH_VU WHERE 1=1";
    let countParams = [];

    if (currentStatus) {
      queryCountStr += " AND DV_TRANGTHAI = ?";
      countParams.push(currentStatus);
    }

    const [countResult] = await db.query(queryCountStr, countParams);
    const totalRecords = countResult[0].total || 0;

    const limitItems = 5;
    const totalPage = Math.ceil(totalRecords / limitItems) || 1;
    const currentPage = parseInt(req.query.page) || 1;
    const skip = (currentPage - 1) * limitItems;

    // 3. Truy vấn lấy dữ liệu có kết hợp lọc trạng thái và phân trang
    let queryStr = "SELECT * FROM DICH_VU WHERE 1=1";
    let queryParams = [];

    if (currentStatus) {
      queryStr += " AND DV_TRANGTHAI = ?";
      queryParams.push(currentStatus);
    }

    // --- SỬA Ở ĐÂY: Thêm ORDER BY DV_ID DESC để đưa dịch vụ mới tạo lên đầu danh sách ---
    queryStr += ` ORDER BY DV_ID DESC LIMIT ${limitItems} OFFSET ${skip}`;
    const [rows] = await db.query(queryStr, queryParams);

    const services = rows.map((item) => ({
      id: item.DV_ID,
      title: item.DV_TEN,
      price: Number(item.DV_GIA).toLocaleString("vi-VN") + "đ",
      description: item.DV_MOTA,
      thumbnail: item.DV_ANH || "/image/thumbnail.jpg",
      status: item.DV_TRANGTHAI,
    }));

    // 4. Khởi tạo mảng filterStatus
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

    // 5. Khởi tạo phân trang
    const pagination = {
      currentPage: currentPage,
      totalPage: totalPage,
    };

    // 6. Render ra view
    res.render("admin/pages/services/index", {
      pageTitle: "Quản lý Dịch vụ Thú cưng",
      path: "/services",
      services: services,
      filterStatus: filterStatus,
      pagination: pagination,
    });
  } catch (error) {
    console.log("Lỗi lấy danh sách dịch vụ cho admin:", error);
    res.redirect("/admin/dashboard");
  }
};

// [POST] /admin/services/delete/:id
module.exports.deleteItem = async (req, res) => {
  try {
    const id = req.params.id;
    await db.query("DELETE FROM DICH_VU WHERE DV_ID = ?", [id]);

    // Gửi thông báo xóa thành công
    req.flash("success", "Xóa dịch vụ thành công!");
    res.redirect("/admin/services");
  } catch (error) {
    console.log("Lỗi xóa dịch vụ:", error);
    req.flash("error", "Xóa dịch vụ thất bại!");
    res.redirect("/admin/services");
  }
};

// [GET] /admin/services/create
module.exports.create = (req, res) => {
  res.render("admin/pages/services/create", {
    pageTitle: "Thêm mới Dịch vụ",
    path: "/services",
  });
};

// [POST] /admin/services/create
module.exports.createPost = async (req, res) => {
  try {
    const { title, price, status, description } = req.body;

    // Lấy link ảnh từ middleware trả về (nếu có)
    const thumbnail = req.body.thumbnail || "";

    const query = `
      INSERT INTO DICH_VU (DV_TEN, DV_GIA, DV_TRANGTHAI, DV_MOTA, DV_ANH, DV_NGAYTAO)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    await db.query(query, [
      title,
      price,
      status || "active",
      description,
      thumbnail,
    ]);

    req.flash("success", "Thêm mới dịch vụ thành công!");
    res.redirect("/admin/services");
  } catch (error) {
    console.log("Lỗi thêm dịch vụ mới:", error);
    req.flash("error", "Thêm mới dịch vụ thất bại!");
    res.redirect("/admin/services/create");
  }
};

// [GET] /admin/services/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id;

    // Lấy thông tin dịch vụ cần sửa từ database
    const [rows] = await db.query("SELECT * FROM DICH_VU WHERE DV_ID = ?", [
      id,
    ]);

    if (rows.length === 0) {
      req.flash("error", "Không tìm thấy dịch vụ cần sửa!");
      return res.redirect("/admin/services");
    }

    const service = rows[0];

    // Render ra view chỉnh sửa kèm theo dữ liệu cũ
    res.render("admin/pages/services/edit", {
      pageTitle: "Chỉnh sửa Dịch vụ",
      path: "/services",
      service: service,
    });
  } catch (error) {
    console.log("Lỗi lấy thông tin dịch vụ để sửa:", error);
    res.redirect("/admin/services");
  }
};

// [POST] /admin/services/edit/:id
module.exports.editPatch = async (req, res) => {
  const id = req.params.id;

  try {
    const { title, price, status, description } = req.body;

    // 1. Lấy thông tin ảnh cũ trong database ra trước
    const [rows] = await db.query(
      "SELECT DV_ANH FROM DICH_VU WHERE DV_ID = ?",
      [id],
    );
    let thumbnail = rows[0] ? rows[0].DV_ANH : "";

    // 2. Nếu người dùng có chọn ảnh mới thì cập nhật link ảnh mới
    if (req.body.thumbnail) {
      thumbnail = req.body.thumbnail;
    }

    // 3. Thực hiện câu lệnh UPDATE vào CSDL
    const query = `
      UPDATE DICH_VU 
      SET DV_TEN = ?, DV_GIA = ?, DV_TRANGTHAI = ?, DV_MOTA = ?, DV_ANH = ?
      WHERE DV_ID = ?
    `;

    await db.query(query, [
      title,
      price,
      status || "active",
      description,
      thumbnail,
      id,
    ]);

    req.flash("success", "Cập nhật dịch vụ thành công!");
    res.redirect("/admin/services");
  } catch (error) {
    console.log("Lỗi cập nhật dịch vụ:", error);
    req.flash("error", "Cập nhật dịch vụ thất bại!");
    res.redirect(`/admin/services/edit/${id}`);
  }
};
