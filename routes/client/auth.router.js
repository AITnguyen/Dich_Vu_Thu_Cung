const express = require("express");
const router = express.Router();
const controller = require("../../controller/client/auth.controller");

// Định tuyến đăng nhập
router.get("/signin", controller.signin);
router.post("/signin", controller.signinPost);

// Định tuyến đăng ký
router.get("/signup", controller.signup);
router.post("/signup", controller.signupPost);

module.exports = router;
