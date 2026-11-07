const db = require("../config/database");

const allowedColumns = ["KH_ID", "KH_EMAIL", "KH_KEYCLOAK", "KH_SDT", "KH_CCCD"];

module.exports.KHACH_HANG = async () => {
  const query = [
    "CREATE TABLE IF NOT EXISTS KHACH_HANG (",
    "KH_ID INT AUTO_INCREMENT PRIMARY KEY,",
    "KH_HOTEN VARCHAR(255) NOT NULL,",
    "KH_EMAIL VARCHAR(255) UNIQUE NOT NULL,",
    "KH_KEYCLOAK VARCHAR(255) UNIQUE,",
    "KH_GIOITINH VARCHAR(50),",
    "KH_SDT VARCHAR(20) UNIQUE,",
    "KH_CCCD VARCHAR(20) UNIQUE,",
    "KH_DIACHI VARCHAR(255),",
    "KH_TRANGTHAI VARCHAR(50) DEFAULT 'active',",
    "KH_ANH LONGTEXT,",
    "KH_NGAYTAO DATE",
    ")",
  ].join(" ");
  await db.query(query);
};

module.exports.INSERT = async (data) => {
  const query =
    "INSERT INTO KHACH_HANG " +
    "(KH_HOTEN, KH_EMAIL, KH_KEYCLOAK, KH_SDT, KH_CCCD, KH_NGAYTAO) " +
    "VALUES (?, ?, ?, ?, ?, ?)";
  const [result] = await db.query(query, [
    data.KH_HOTEN,
    data.KH_EMAIL,
    data.KH_KEYCLOAK,
    data.KH_SDT || null,
    data.KH_CCCD || null,
    data.KH_NGAYTAO,
  ]);
  return result;
};

module.exports.SELECT_KH = async (column, value) => {
  if (!allowedColumns.includes(column)) {
    throw new Error("Tên cột tìm khách hàng không hợp lệ");
  }

  const [rows] = await db.query(
    "SELECT * FROM KHACH_HANG WHERE " + column + " = ? LIMIT 1",
    [value],
  );
  return rows[0] || null;
};

module.exports.findDuplication = async (column, value) => {
  if (!["KH_EMAIL", "KH_SDT", "KH_CCCD"].includes(column)) {
    throw new Error("Tên cột kiểm tra trùng không hợp lệ");
  }
  return module.exports.SELECT_KH(column, value);
};

module.exports.UPDATE_KEYCLOAK = async (id, keycloakId) => {
  const [result] = await db.query(
    "UPDATE KHACH_HANG SET KH_KEYCLOAK = ? WHERE KH_ID = ?",
    [keycloakId, id],
  );
  return result;
};

module.exports.UPDATE_PROFILE = async (id, data) => {
  const [result] = await db.query(
    "UPDATE KHACH_HANG SET KH_HOTEN = ?, KH_SDT = ? WHERE KH_ID = ?",
    [data.fullName, data.phone || null, id],
  );
  return result;
};