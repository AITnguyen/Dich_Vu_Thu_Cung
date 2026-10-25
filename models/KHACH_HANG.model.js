const db = require("../config/database");
module.exports.KHACH_HANG = async () => {
  let q = `
  CREATE TABLE IF NOT EXISTS KHACH_HANG (
    KH_ID INT AUTO_INCREMENT PRIMARY KEY,
    KH_HOTEN VARCHAR(255) NOT NULL,
    KH_EMAIL VARCHAR(255) UNIQUE NOT NULL,
    KH_KEYCLOAK VARCHAR(255) UNIQUE,
    KH_GIOITINH VARCHAR(50),
    KH_SDT VARCHAR(20) UNIQUE,
    KH_CCCD VARCHAR(20) UNIQUE,
    KH_DIACHI VARCHAR(255), 
    KH_TRANGTHAI VARCHAR(50) DEFAULT "active",
    KH_ANH LONGTEXT,
    KH_NGAYTAO DATE

  )
  `;
  try {
    await db.query(q);
    console.log("Tao bang KHACH_HANG thanh cong");
  } catch (error) {
    console.log("Tao bang KHACH_HANG that bai", error);
  }
};

module.exports.INSERT = async (data) => {
  let q = `
  INSERT INTO KHACH_HANG(KH_HOTEN, KH_EMAIL, KH_MATKHAU, KH_SDT, KH_CCCD, KH_NGAYTAO) 
  VALUES(?, ?, ?, ?, ?, ?)`;
  try {
    await db.query(q, [
      data.KH_HOTEN,
      data.KH_EMAIL,
      data.KH_MATKHAU,
      data.KH_SDT || null,
      data.KH_CCCD || null,
      data.KH_NGAYTAO,
    ]);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports.findDuplication = async (arr, data) => {
  const allowed = ["KH_EMAIL", "KH_SDT", "KH_CCCD"];
  if (allowed.includes(arr)) {
    let q = `SELECT * FROM KHACH_HANG WHERE ${arr} = ?`;
    try {
      const [rows] = await db.query(q, [data]);
      return rows[0];
    } catch (error) {
      console.log(error);
      throw error;
    }
  } else {
    throw new Error("Tên cột không hợp lệ");
  }
};

module.exports.SELECT_KH = async (key, value) => {
  let q = `SELECT * FROM KHACH_HANG WHERE ${key} = ?`;
  try {
    const [rows] = await db.query(q, [value]);
    return rows[0];
  } catch (error) {
    throw error;
  }
};
