const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASS,
  database: process.env.DATABASE,
  port: process.env.PORT_MYSQL,
  dateStrings: true,
});
module.exports = db;
