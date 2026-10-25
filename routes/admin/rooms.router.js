const express = require("express");
const router = express.Router();

const controller = require("../../controller/admin/rooms.controller");

router.get("/", controller.index);
router.get("/delete/:id", controller.delete);

module.exports = router;
