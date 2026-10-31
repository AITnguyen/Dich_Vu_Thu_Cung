const express = require("express");
const router = express.Router();
const controller = require("../../controller/admin/services.controller");
const multer = require("multer");
const storageHelper = require("../../helper/storage.helper");
const upload = multer({ storage: storageHelper() });
const uploadCloud = require("../../middleware/uploadCloud.middleware");

router.get("/create", controller.create);
router.post(
  "/create",
  upload.single("thumbnail"),
  uploadCloud.upload,
  controller.createPost,
);

router.get("/edit/:id", controller.edit);
router.post(
  "/edit/:id",
  upload.single("thumbnail"),
  uploadCloud.upload,
  controller.editPatch,
);
router.post("/delete/:id", controller.deleteItem);

router.get("/", controller.index);

module.exports = router;
