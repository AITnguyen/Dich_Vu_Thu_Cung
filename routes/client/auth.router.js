// const express = require("express");
// const router = express.Router();
// const controller = require("../../controller/client/auth.controller");

// // Định tuyến đăng nhập
// router.get("/signin", controller.signin);
// router.post("/signin", controller.signinPost);

// // Định tuyến đăng ký
// router.get("/signup", controller.signup);
// router.post("/signup", controller.signupPost);

// module.exports = router;

const express = require("express");
const router = express.Router();
const controller = require("../../controller/client/auth.controller");

// [GET] /auth/signin - Hiển thị trang đăng nhập
router.get("/signin", controller.signin);

// [POST] /auth/signin - Xử lý đăng nhập
router.post("/signin", controller.signinPost);

// [GET] /auth/signup - Hiển thị trang đăng ký
router.get("/signup", controller.signup);

// [POST] /auth/signup - Xử lý đăng ký
router.post("/signup", controller.signupPost);

module.exports = router;
