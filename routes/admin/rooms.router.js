const express = require("express");
const multer = require("multer");
const router = express.Router();

const controller = require("../../controller/admin/rooms.controller");
const storageHelper = require("../../helper/storage.helper");
const uploadCloud = require("../../middleware/uploadCloud.middleware");

const upload = multer({ storage: storageHelper() });

router.get("/create", controller.create);
router.post(
  "/create",
  upload.single("thumbnail"),
  uploadCloud.upload,
  controller.createPost,
);

router.get("/detail/:id", controller.detail);

router.get("/edit/:id", controller.edit);
router.post(
  "/edit/:id",
  upload.single("thumbnail"),
  uploadCloud.upload,
  controller.editPatch,
);

router.post("/delete/:id", controller.delete);
router.get("/", controller.index);

module.exports = router;
