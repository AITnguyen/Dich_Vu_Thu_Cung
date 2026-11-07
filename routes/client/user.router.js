const express = require("express");
const router = express.Router();
const controller = require("../../controller/client/user.controller");
const authMiddleware = require("../../middleware/auth.middleware");

router.use(authMiddleware.requireCustomer);

router.get("/info", controller.info);
router.get("/edit", controller.edit);
router.post("/edit", controller.editPost);
router.get("/reset-password", controller.resetPassword);
router.post("/reset-password", controller.resetPasswordPost);

module.exports = router;
