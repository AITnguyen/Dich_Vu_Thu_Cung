const express = require("express");
const router = express.Router();

const controller = require("../../controller/client/home.controller")

router.get("/", controller);

module.exports = router;