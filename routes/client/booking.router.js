const express = require("express");
const router = express.Router();

const controller = require("../../controller/client/booking.controller");
const authMiddleware = require("../../middleware/auth.middleware");

// SePay gọi route này từ bên ngoài, nên để trước requireCustomer.
router.post("/sepay/ipn", controller.sepayIpn);

router.use(authMiddleware.requireCustomer);

router.get("/history", controller.history);
router.get("/payment/result", controller.paymentResult);

router.get("/services/:id", controller.serviceForm);
router.post("/services/:id", controller.servicePost);
router.get("/rooms/:id", controller.roomForm);
router.post("/rooms/:id", controller.roomPost);

router.get("/pay/services/:id", controller.payService);
router.get("/pay/rooms/:id", controller.payRoom);

module.exports = router;
