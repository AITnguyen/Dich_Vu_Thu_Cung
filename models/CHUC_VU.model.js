const db = require("../config/database");

module.exports.CHUC_VU = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS CHUC_VU (
    CV_ID INT AUTO_INCREMENT PRIMARY KEY,
    CV_TEN VARCHAR(255) NOT NULL,
    CV_LEVEL INT NOT NULL,
    CV_MOTA LONGTEXT,
    CV_TRANGTHAI VARCHAR(50) DEFAULT 'active',
    CV_NGAYTAO DATE
  )
  `;
  try {
    await db.query(q);
    console.log("Tao bang CHUC_VU thanh cong");
  } catch (error) {
    console.log("Tao bang CHUC_VU that bai");
  }
};