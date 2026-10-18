const db = require("../config/database");

module.exports.SD_PHONG_LUU_TRU = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS SU_DUNG_PHONG (
    SDP_ID INT AUTO_INCREMENT PRIMARY KEY,
    TN_ID INT,
    PHONG_ID INT,
    SDP_NGAYNHAN DATETIME NOT NULL,
    SDP_NGAYTRA DATETIME,
    SDP_TONGTIEN DECIMAL(10, 2),
    SDP_TRANGTHAI VARCHAR(50) DEFAULT 'DangThue', -- DangThue, DaTra
    FOREIGN KEY (TN_ID) REFERENCES THU_NUOI(TN_ID) ON DELETE CASCADE,
    FOREIGN KEY (PHONG_ID) REFERENCES PHONG(PHONG_ID) ON DELETE CASCADE
  )
  `;
  try {
    await db.query(q);
    console.log("Tao bang SD_PHONG_LUU_TRU thanh cong");
  } catch (error) {
    console.log("Tao bang SD_PHONG_LUU_TRU that bai");
  }
};