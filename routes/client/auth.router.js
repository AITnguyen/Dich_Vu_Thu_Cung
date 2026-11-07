const express = require("express");
const router = express.Router();
const controller = require("../../controller/client/auth.controller");
const passwordController = require("../../controller/password.controller");

router.get("/signin", controller.signin);
router.post("/signin", controller.signinPost);
router.get("/signup", controller.signup);
router.post("/signup", controller.signupPost);
router.get("/otp", controller.otp);
router.post("/otp", controller.signupVerify);
router.post("/signout", controller.signout);

router.get("/forgot-password", (req, res) =>
  passwordController.forgotPage(req, res, "customer"),
);
router.post("/forgot-password", (req, res) =>
  passwordController.sendResetOtp(req, res, "customer"),
);
router.get("/reset-password", (req, res) =>
  passwordController.resetPage(req, res, "customer"),
);
router.post("/reset-password", (req, res) =>
  passwordController.resetPassword(req, res, "customer"),
);

module.exports = router;
