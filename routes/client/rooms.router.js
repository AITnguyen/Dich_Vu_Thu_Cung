const express = require("express");
const router = express.Router();

const controller = require("../../controller/client/rooms.controller");

router.get("/", controller.index);

module.exports = router;
