const db = require("../../config/database");
const phongModel = require("../../models/PHONG_LUU_TRU.model");

// [GET] /admin/rooms
module.exports.index = async (req, res) => {
  try {
    const currentStatus = req.query.status || "";

    // 1. Đếm tổng số bản ghi trong bảng PHONG
    let queryCountStr = "SELECT COUNT(*) as total FROM PHONG WHERE 1=1";
    let countParams = [];

    if (currentStatus) {
      queryCountStr += " AND PHONG_TRANGTHAI = ?";
      countParams.push(currentStatus);
    }

    const [countResult] = await db.query(queryCountStr, countParams);
    const totalRecords = countResult[0].total || 0;

    const limitItems = 2; // Số lượng hiển thị trên 1 trang
    const totalPage = Math.ceil(totalRecords / limitItems) || 1;
    const currentPage = parseInt(req.query.page) || 1;
    const skip = (currentPage - 1) * limitItems;

    // 2. Truy vấn lấy dữ liệu phòng có phân trang và lọc trạng thái
    let queryStr = "SELECT * FROM PHONG WHERE 1=1";
    let queryParams = [];

    if (currentStatus) {
      queryStr += " AND PHONG_TRANGTHAI = ?";
      queryParams.push(currentStatus);
    }

    queryStr += ` LIMIT ${limitItems} OFFSET ${skip}`;
    const [rows] = await db.query(queryStr, queryParams);

    // Ánh xạ các thuộc tính khớp với model PHONG
    const rooms = rows.map((item) => ({
      id: item.PHONG_ID,
      name: item.PHONG_TEN,
      capacity: item.PHONG_SL,
      price: Number(item.PHONG_GIANGAY || 0).toLocaleString("vi-VN") + "đ",
      status: item.PHONG_TRANGTHAI,
      description: item.PHONG_MOTA,
      thumbnail: item.PHONG_ANH || "/image/thumbnail.jpg",
      createdAt: item.PHONG_NGAYTAO,
    }));

    // 3. Khởi tạo mảng lọc trạng thái khớp với mixin
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

    // 4. Khởi tạo phân trang
    const pagination = {
      currentPage: currentPage,
      totalPage: totalPage,
    };

    // 5. Render ra view quản lý phòng
    res.render("admin/pages/rooms/index", {
      pageTitle: "Quản lý Phòng lưu trú",
      path: "/rooms",
      rooms: rooms,
      filterStatus: filterStatus,
      pagination: pagination,
    });
  } catch (error) {
    console.log("Lỗi lấy danh sách phòng lưu trú:", error);
    res.redirect("/admin/dashboard");
  }
};

// [DELETE] /admin/rooms/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    await phongModel.DELETE(id);
    res.redirect("/admin/rooms");
  } catch (error) {
    console.log(error);
    res.redirect("/admin/rooms");
  }
};
