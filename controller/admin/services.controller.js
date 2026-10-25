const db = require("../../config/database");
const dichVuModel = require("../../models/DICH_VU.model"); // Gọi đúng đường dẫn đến file model của bạn

// [GET] /admin/services
module.exports.index = async (req, res) => {
  try {
    // 1. Lấy trạng thái từ query (nếu người dùng bấm chọn lọc)
    const currentStatus = req.query.status || "";

    // 2. Xử lý phân trang
    let queryCountStr = "SELECT COUNT(*) as total FROM DICH_VU WHERE 1=1";
    let countParams = [];

    if (currentStatus) {
      queryCountStr += " AND DV_TRANGTHAI = ?";
      countParams.push(currentStatus);
    }

    // Lấy tổng số bản ghi thỏa mãn điều kiện
    const [countResult] = await db.query(queryCountStr, countParams);
    const totalRecords = countResult[0].total;

    const limitItems = 5; // Số lượng dịch vụ hiển thị trên 1 trang (bạn có thể đổi số này tùy ý)
    const totalPage = Math.ceil(totalRecords / limitItems) || 1; // Tính tổng số trang
    const currentPage = parseInt(req.query.page) || 1;
    const skip = (currentPage - 1) * limitItems;

    // 3. Viết câu lệnh SQL lấy dữ liệu có kết hợp phân trang (LIMIT, OFFSET) và lọc trạng thái
    let queryStr = "SELECT * FROM DICH_VU WHERE 1=1";
    let queryParams = [];

    if (currentStatus) {
      queryStr += " AND DV_TRANGTHAI = ?";
      queryParams.push(currentStatus);
    }

    queryStr += " LIMIT ? OFFSET ?";
    queryParams.push(limitItems, skip);

    const [rows] = await db.query(queryStr, queryParams);

    const services = rows.map((item) => ({
      id: item.DV_ID,
      title: item.DV_TEN,
      price: Number(item.DV_GIA).toLocaleString("vi-VN") + "đ",
      description: item.DV_MOTA,
      thumbnail: item.DV_ANH || "/image/thumbnail.jpg",
      status: item.DV_TRANGTHAI,
    }));

    // 4. Khởi tạo mảng filterStatus khớp với mixin lọc trạng thái
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

    // 5. Khởi tạo đối tượng phân trang truyền sang view
    const pagination = {
      currentPage: currentPage,
      totalPage: totalPage, // Truyền tổng số trang tính toán từ DB vào đây
    };

    // 6. Render ra view kèm theo các biến bắt buộc
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
    // Gọi hàm DELETE từ model dichVuModel
    await dichVuModel.DELETE(id);

    req.flash("success", "Xóa thành công");
    res.redirect("/admin/services");
  } catch (error) {
    req.flash("error", "Xóa thất bại");
    res.redirect("/admin/services");
  }
};
