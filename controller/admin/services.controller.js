const db = require("../../config/database");
const dichVuModel = require("../../models/DICH_VU.model");

// [GET] /admin/services
module.exports.index = async (req, res) => {
  try {
    console.log("-----------------------------------------");
    console.log("CONTROLLER SERVICES ĐANG CHẠY THỰC TẾ!");

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
    console.log("📊 Kết quả đếm từ DB (countResult):", countResult);

    // Lấy tổng số bản ghi an toàn (tránh trường hợp tên cột bị viết hoa hoặc undefined)
    const totalRecords = countResult[0]?.total || countResult[0]?.TOTAL || 0;
    console.log("Tổng số bản ghi (totalRecords):", totalRecords);

    const limitItems = 2; // Cố định 2 bản ghi trên 1 trang để test
    const totalPage = Math.ceil(totalRecords / limitItems) || 1;
    const currentPage = parseInt(req.query.page) || 1;
    const skip = (currentPage - 1) * limitItems;

    console.log(
      `📄 Phân trang -> limitItems: ${limitItems}, totalPage: ${totalPage}, currentPage: ${currentPage}, skip: ${skip}`,
    );

    // 3. Truy vấn lấy dữ liệu có kết hợp lọc trạng thái và phân trang
    let queryStr = "SELECT * FROM DICH_VU WHERE 1=1";
    let queryParams = [];

    if (currentStatus) {
      queryStr += " AND DV_TRANGTHAI = ?";
      queryParams.push(currentStatus);
    }

    queryStr += ` LIMIT ${limitItems} OFFSET ${skip}`;
    console.log("🔍 Câu lệnh SQL Query thực tế:", queryStr);

    const [rows] = await db.query(queryStr, queryParams);
    console.log(
      "📋 Số lượng dòng dữ liệu trả về thực tế (rows.length):",
      rows.length,
    );

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

// [DELETE] /admin/services/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    await dichVuModel.DELETE(id);
    res.redirect("/admin/services");
  } catch (error) {
    console.log(error);
    res.redirect("/admin/services");
  }
};
