const db = require("../config/database");

module.exports.PHONG_LUU_TRU = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS PHONG (
    PHONG_ID INT AUTO_INCREMENT PRIMARY KEY,
    PHONG_TEN VARCHAR(100) NOT NULL,
    PHONG_SL INT CHECK(PHONG_SL > 0) NOT NULL,
    PHONG_GIANGAY DECIMAL(10, 2) NOT NULL,
    PHONG_TRANGTHAI VARCHAR(50) DEFAULT 'active', 
    PHONG_MOTA LONGTEXT,
    PHONG_ANH LONGTEXT,
    PHONG_NGAYTAO LONGTEXT
  )
  `;
  try {
    await db.query(q);
    console.log("Tao bang PHONG_LUU_TRU thanh cong");
  } catch (error) {
    console.log("Tao bang PHONG_LUU_TRU that bai");
  }
};

// Xoa phong
module.exports.DELETE = async (id) => {
  try {
    const [result] = await db.query("DELETE FROM PHONG WHERE PHONG_ID = ?", [
      id,
    ]);
    return result;
  } catch (error) {
    throw error;
  }
};
