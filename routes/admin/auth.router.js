const express = require("express");
const router = express.Router();
const controller = require("../../controller/admin/auth.controller");
const passwordController = require("../../controller/password.controller");

router.get("/signin", controller.signin);
router.post("/signin", controller.signinPost);
router.post("/logout", controller.signout);

router.get("/forgot-password", (req, res) =>
  passwordController.forgotPage(req, res, "admin"),
);
router.post("/forgot-password", (req, res) =>
  passwordController.sendResetOtp(req, res, "admin"),
);
router.get("/reset-password", (req, res) =>
  passwordController.resetPage(req, res, "admin"),
);
router.post("/reset-password", (req, res) =>
  passwordController.resetPassword(req, res, "admin"),
);

module.exports = router;
