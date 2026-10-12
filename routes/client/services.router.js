const express = require("express");
const router = express.Router();

// Gọi file Controller xử lý dịch vụ
const controller = require("../../controller/client/services.controller");

// Trang danh sách dịch vụ: /services
router.get("/", controller.index);

module.exports = router;