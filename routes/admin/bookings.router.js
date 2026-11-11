const express = require("express");
const router = express.Router();
const controller = require("../../controller/admin/bookings.controller");

router.get("/", controller.index);
router.get("/detail/:type/:id", controller.detail);
router.post("/:type/:id/approve", controller.approve);
router.post("/:type/:id/reject", controller.reject);
router.post("/:type/:id/cash-paid", controller.markCashPaid);

module.exports = router;
