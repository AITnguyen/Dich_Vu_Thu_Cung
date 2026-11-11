const db = require("../../config/database");

module.exports.index = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT PHONG_ID, PHONG_TEN, PHONG_SL, PHONG_GIANGAY,
              PHONG_MOTA, PHONG_ANH
       FROM PHONG
       WHERE PHONG_TRANGTHAI = 'active'
       ORDER BY PHONG_ID DESC`,
    );

    const rooms = rows.map((room) => ({
      id: room.PHONG_ID,
      name: room.PHONG_TEN,
      capacity: room.PHONG_SL,
      price: Number(room.PHONG_GIANGAY || 0).toLocaleString("vi-VN"),
      description: room.PHONG_MOTA || "",
      image: room.PHONG_ANH || "/image/thumbnail.jpg",
    }));

    res.render("client/pages/rooms/index", {
      pageTitle: "Phòng lưu trú - PetCare",
      rooms,
      errorMessage: req.flash("error")[0] || "",
      successMessage: req.flash("success")[0] || "",
    });
  } catch (error) {
    console.error("Lỗi tải danh sách phòng:", error.message);
    req.flash("error", "Không thể tải danh sách phòng lưu trú.");
    res.redirect("/");
  }
};
