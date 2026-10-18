const db = require("../config/database");

module.exports.THU_NUOI = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS THU_NUOI (
    TN_ID INT AUTO_INCREMENT PRIMARY KEY,
    TN_TEN VARCHAR(255) NOT NULL,
    TN_TUOI INT,
    TN_CANNANG FLOAT,
    KH_ID INT,
    GIONG_ID INT,
    TN_GHICHU LONGTEXT,
    FOREIGN KEY (KH_ID) REFERENCES KHACH_HANG(KH_ID) ON DELETE CASCADE,
    FOREIGN KEY (GIONG_ID) REFERENCES GIONG(GIONG_ID) ON DELETE SET NULL
  )
  `;
  try {
    await db.query(q);
    console.log("Tao bang THU_NUOI thanh cong");
  } catch (error) {
    console.log("Tao bang THU_NUOI that bai");
  }
};