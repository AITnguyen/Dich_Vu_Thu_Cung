const express = require("express");
const router = express.Router();
const controller = require("../../controller/admin/services.controller");

router.get("/create", controller.create);
router.post("/create", controller.createPost);
router.get("/", controller.index);

module.exports = router;
