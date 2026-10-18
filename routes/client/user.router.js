const express = require("express");
const router = express.Router();

const controller = require("../../controller/client/user.controller");

//Trang xem thông tin cá nhân
router.get("/info", controller.info);

//Chỉnh sửa thông tin cá nhân
router.get("/edit", controller.edit);
router.post("/edit", controller.editPost);

//Đổi mật khẩu
router.get("/reset-password", controller.resetPassword);
router.post("/reset-password", controller.resetPasswordPost);

module.exports = router;
