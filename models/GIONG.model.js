const db = require("../config/database");

module.exports.GIONG = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS GIONG (
    GIONG_ID INT AUTO_INCREMENT PRIMARY KEY,
    GIONG_TEN VARCHAR(255) NOT NULL,
    GIONG_LOAI VARCHAR(100) NOT NULL, 
    GIONG_MOTA LONGTEXT
  )
  `;
  try {
    await db.query(q);
    console.log("Tao bang GIONG thanh cong");
  } catch (error) {
    console.log("Tao bang GIONG that bai");
  }
};
