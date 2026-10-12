const express = require("express");
const router = express.Router();

const controller = require("../../controller/client/services.controller");

// Trang danh sách dịch vụ: /services
router.get("/", controller.index);


module.exports = router;