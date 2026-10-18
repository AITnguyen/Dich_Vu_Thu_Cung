const db = require("../config/database");

module.exports.PHONG_LUU_TRU = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS PHONG (
    PHONG_ID INT AUTO_INCREMENT PRIMARY KEY,
    PHONG_TEN VARCHAR(100) NOT NULL,
    PHONG_LOAI VARCHAR(100), 
    PHONG_GIANGAY DECIMAL(10, 2) NOT NULL,
    PHONG_TRANGTHAI VARCHAR(50) DEFAULT 'Trong', 
    PHONG_MOTA LONGTEXT
  )
  `;
  try {
    await db.query(q);
    console.log("Tao bang PHONG_LUU_TRU thanh cong");
  } catch (error) {
    console.log("Tao bang PHONG_LUU_TRU that bai");
  }
};
