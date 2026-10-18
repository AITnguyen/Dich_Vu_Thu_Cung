const db = require("../config/database");

module.exports.SD_DICH_VU = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS SU_DUNG_DICH_VU (
    SDDV_ID INT AUTO_INCREMENT PRIMARY KEY,
    TN_ID INT,
    DV_ID INT,
    NV_ID INT,
    SDDV_SOLUONG INT DEFAULT 1,
    SDDV_NGAYSUDUNG DATETIME DEFAULT CURRENT_TIMESTAMP,
    SDDV_THANHTIEN DECIMAL(10, 2),
    FOREIGN KEY (TN_ID) REFERENCES THU_NUOI(TN_ID) ON DELETE CASCADE,
    FOREIGN KEY (DV_ID) REFERENCES DICH_VU(DV_ID) ON DELETE CASCADE,
    FOREIGN KEY (NV_ID) REFERENCES NHAN_VIEN(NV_ID) ON DELETE SET NULL
  )
  `;
  try {
    await db.query(q);
    console.log("Tao bang SD_DICH_VU thanh cong");
  } catch (error) {
    console.log("Tao bang SD_DICH_VU that bai");
  }
};