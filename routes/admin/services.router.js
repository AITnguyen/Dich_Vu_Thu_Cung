const express = require("express");
const router = express.Router();
const controller = require("../../controller/admin/services.controller");

router.get("/create", controller.create);
router.post("/create", controller.createPost);

router.get("/edit/:id", controller.edit);
router.post("/edit/:id", controller.editPatch);

router.post("/delete/:id", controller.deleteItem);

router.get("/", controller.index);

module.exports = router;
