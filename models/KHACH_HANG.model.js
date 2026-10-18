const db = require("../config/database");

module.exports.KHACH_HANG = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS KHACH_HANG (
    KH_ID INT AUTO_INCREMENT PRIMARY KEY,
    KH_HOTEN VARCHAR(255) NOT NULL,
    KH_SDT VARCHAR(20) UNIQUE NOT NULL,
    KH_DIACHI LONGTEXT,
    KH_EMAIL VARCHAR(255),
    KH_NGAYTAO DATE
  )
  `;
  try {
    await db.query(q);
    console.log("Tao bang KHACH_HANG thanh cong");
  } catch (error) {
    console.log("Tao bang KHACH_HANG that bai");
  }
};
