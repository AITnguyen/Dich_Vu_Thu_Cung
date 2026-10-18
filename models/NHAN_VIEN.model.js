const db = require("../config/database");

module.exports.NHAN_VIEN = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS NHAN_VIEN (
    NV_ID INT AUTO_INCREMENT PRIMARY KEY,
    NV_HOTEN VARCHAR(255) NOT NULL,
    NV_SDT VARCHAR(20) UNIQUE NOT NULL,
    NV_EMAIL VARCHAR(255),
    NV_MATKHAU VARCHAR(255) NOT NULL,
    CV_ID INT,
    NV_TRANGTHAI VARCHAR(50) DEFAULT 'active',
    NV_NGAYTAO DATE,
    FOREIGN KEY (CV_ID) REFERENCES CHUC_VU(CV_ID) ON DELETE SET NULL
  )
  `;
  try {
    await db.query(q);
    console.log("Tao bang NHAN_VIEN thanh cong");
  } catch (error) {
    console.log("Tao bang NHAN_VIEN that bai");
  }
};