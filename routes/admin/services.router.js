const express = require("express");
const router = express.Router();
const controller = require("../../controller/admin/services.controller");

router.get("/create", controller.create);
router.post("/create", controller.createPost);

router.post("/delete/:id", controller.deleteItem);

// router.get("/edit/:id", controller.edit);
// router.patch("/edit/:id", controller.upload, controller.editPatch);

router.get("/", controller.index);

module.exports = router;
