const db = require("../config/database");

module.exports.DICH_VU = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS DICH_VU (
    DV_ID INT AUTO_INCREMENT PRIMARY KEY,
    DV_TEN VARCHAR(255) NOT NULL,
    DV_GIA DECIMAL(10, 2) NOT NULL,
    DV_MOTA LONGTEXT,
    DV_TRANGTHAI VARCHAR(50) DEFAULT 'active' -- active, inactive
  )
  `;
  try {
    await db.query(q);
    console.log("Tao bang DICH_VU thanh cong");
  } catch (error) {
    console.log("Tao bang DICH_VU that bai");
  }
};
