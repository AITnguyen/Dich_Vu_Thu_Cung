const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/auth.controller");

router.get("/signup", controller.signup);
router.get("/signin", controller.signin);
router.post("/signin", controller.signinPost);
router.get("/logout", controller.logout);

module.exports = router;
