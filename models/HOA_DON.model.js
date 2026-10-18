const db = require("../config/database");

module.exports.HOA_DON = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS HOA_DON (
    HD_ID INT AUTO_INCREMENT PRIMARY KEY,
    KH_ID INT,
    NV_ID INT,
    HD_TONGTIEN DECIMAL(10, 2) NOT NULL,
    HD_NGAYLAP DATETIME DEFAULT CURRENT_TIMESTAMP,
    HD_TRANGTHAI VARCHAR(50) DEFAULT 'ChuaThanhToan',
    FOREIGN KEY (KH_ID) REFERENCES KHACH_HANG(KH_ID) ON DELETE SET NULL,
    FOREIGN KEY (NV_ID) REFERENCES NHAN_VIEN(NV_ID) ON DELETE SET NULL
  )
  `;
  try {
    await db.query(q);
    console.log("Tao bang HOA_DON thanh cong");
  } catch (error) {
    console.log("Tao bang HOA_DON that bai");
  }
};
