const db = require("../config/database");

module.exports.NHAN_VIEN = async () => {
  const query = [
    "CREATE TABLE IF NOT EXISTS NHAN_VIEN (",
    "NV_ID INT AUTO_INCREMENT PRIMARY KEY,",
    "NV_HOTEN VARCHAR(255) NOT NULL,",
    "NV_SDT VARCHAR(20) UNIQUE NOT NULL,",
    "NV_EMAIL VARCHAR(255),",
    "NV_KEYCLOAK VARCHAR(255) UNIQUE,",
    "CV_ID INT,",
    "NV_DIACHI LONGTEXT,",
    "NV_ANH LONGTEXT,",
    "NV_TRANGTHAI VARCHAR(50) DEFAULT 'active',",
    "NV_NGAYTAO DATE,",
    "FOREIGN KEY (CV_ID) REFERENCES CHUC_VU(CV_ID) ON DELETE SET NULL",
    ")",
  ].join(" ");
  await db.query(query);
};

module.exports.SELECT_NV = async (column, value) => {
  if (!["NV_ID", "NV_EMAIL", "NV_KEYCLOAK"].includes(column)) {
    throw new Error("Tên cột tìm nhân viên không hợp lệ");
  }

  const [rows] = await db.query(
    "SELECT * FROM NHAN_VIEN WHERE " + column + " = ? LIMIT 2",
    [value],
  );

  if (column === "NV_EMAIL" && rows.length > 1) {
    throw new Error("Email nhân viên bị trùng trong cơ sở dữ liệu");
  }

  return rows[0] || null;
};

module.exports.UPDATE_KEYCLOAK = async (id, keycloakId) => {
  const [result] = await db.query(
    "UPDATE NHAN_VIEN SET NV_KEYCLOAK = ? WHERE NV_ID = ?",
    [keycloakId, id],
  );
  return result;
};
