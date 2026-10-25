const db = require("../../config/database");
const dichVuModel = require("../../models/DICH_VU.model");
// const multer = require("multer");
// const path = require("path");

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

    const limitItems = 5; // Cố định 2 bản ghi trên 1 trang để test phân trang
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

    queryStr += ` LIMIT ${limitItems} OFFSET ${skip}`;
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

    // Thực hiện xóa dịch vụ trong database theo khóa chính DV_ID
    await db.query("DELETE FROM DICH_VU WHERE DV_ID = ?", [id]);

    res.redirect("/admin/services"); // Quay lại trang trước sau khi xóa thành công
  } catch (error) {
    console.log("Lỗi xóa dịch vụ:", error);
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

    // Sửa lại tên các cột cho khớp với cơ sở dữ liệu thực tế (DV_TEN, DV_GIA, DV_TRANGTHAI, DV_MOTA)
    const query = `
      INSERT INTO DICH_VU (DV_TEN, DV_GIA, DV_TRANGTHAI, DV_MOTA, DV_NGAYTAO)
      VALUES (?, ?, ?, ?, NOW())
    `;

    await db.query(query, [title, price, status || "active", description]);

    res.redirect("/admin/services");
  } catch (error) {
    console.log("Lỗi thêm dịch vụ mới:", error);
    res.redirect("/admin/services/create");
  }
};

// // [GET] /admin/services/edit/:id
// module.exports.edit = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const [services] = await db.query("SELECT * FROM DICH_VU WHERE id = ?", [
//       id,
//     ]);

//     if (services.length > 0) {
//       res.render("admin/pages/services/edit", {
//         pageTitle: "Chỉnh sửa Dịch vụ",
//         service: services[0],
//         path: "/services",
//       });
//     } else {
//       res.redirect("/admin/services");
//     }
//   } catch (error) {
//     console.log("Lỗi lấy dữ liệu dịch vụ để sửa:", error);
//     res.redirect("/admin/services");
//   }
// };

// // [PATCH] /admin/services/edit/:id
// module.exports.editPatch = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const { title, price, status, description } = req.body;

//     // Giữ lại ảnh cũ nếu người dùng không chọn ảnh mới
//     let thumbnail = req.body.oldThumbnail;
//     if (req.file) {
//       thumbnail = `/uploads/${req.file.filename}`;
//     }

//     const query = `
//       UPDATE DICH_VU
//       SET title = ?, price = ?, status = ?, description = ?, thumbnail = ?
//       WHERE id = ?
//     `;

//     await db.query(query, [title, price, status, description, thumbnail, id]);
//     res.redirect("/admin/services");
//   } catch (error) {
//     console.log("Lỗi cập nhật dịch vụ:", error);
//     res.redirect(`/admin/services/edit/${req.params.id}`);
//   }
// };
