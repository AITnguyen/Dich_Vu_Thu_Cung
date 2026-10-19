const db = require("../../config/database");

// Hàm tạo bảng nếu chưa có
module.exports.DICH_VU = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS dich_vu (
    DV_ID INT AUTO_INCREMENT PRIMARY KEY,
    DV_TEN VARCHAR(255) NOT NULL,
    DV_GIA DECIMAL(10, 2) NOT NULL,
    DV_MOTA LONGTEXT,
    DV_TRANGTHAI VARCHAR(50) DEFAULT 'active'
  )
  `;
  try {
    await db.query(q);
    console.log("Tao bang dich_vu thanh cong");
  } catch (error) {
    console.log("Tao bang dich_vu that bai", error);
  }
};

// Hàm lấy danh sách dịch vụ từ Database truyền ra giao diện
module.exports.index = async (req, res) => {
  try {
    // Truy vấn lấy tất cả dịch vụ từ database
    const [rows] = await db.query(
      "SELECT * FROM dich_vu WHERE DV_TRANGTHAI = 'active'",
    );

    // Chuẩn hóa lại cấu trúc dữ liệu nếu cần cho khớp với file Pug cũ của bạn
    const services = rows.map((item) => ({
      id: item.DV_ID,
      title: item.DV_TEN,
      price: Number(item.DV_GIA).toLocaleString("vi-VN") + " VND / lượt",
      category: item.DV_MOTA,
      location: "Chi nhánh Ninh Kiều, Cần Thơ",
      thumbnail: "/image/thumbnail.jpg",
    }));

    res.render("client/pages/services/index", {
      pageTitle: "Danh sách Dịch vụ - Pet Care",
      services: services,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};
