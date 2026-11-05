const db = require("../config/database");

// Tạo bảng DICH_VU
module.exports.DICH_VU = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS DICH_VU (
    DV_ID INT AUTO_INCREMENT PRIMARY KEY,
    DV_TEN VARCHAR(255) NOT NULL,
    DV_GIA DECIMAL(10, 2) NOT NULL,
    DV_MOTA LONGTEXT,
    DV_TRANGTHAI VARCHAR(50) DEFAULT 'active', -- active, inactive
    DV_ANH LONGTEXT,
    DV_NGAYTAO LONGTEXT
  )
  `;

  try {
    await db.query(query);
    console.log("Tao bang DICH_VU thanh cong");
  } catch (error) {
    console.log("Tao bang DICH_VU that bai:", error.message);
  }
};

// Chỉ xóa dịch vụ chưa có lịch sử sử dụng
module.exports.DELETE = async (id) => {
  const [result] = await db.query(
    `DELETE FROM DICH_VU
     WHERE DV_ID = ?
       AND NOT EXISTS (
         SELECT 1
         FROM SU_DUNG_DICH_VU
         WHERE DV_ID = ?
       )`,
    [id, id],
  );

  return result;
};
