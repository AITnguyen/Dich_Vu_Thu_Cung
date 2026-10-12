const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  res.render("client/pages/home/index")
});

module.exports = router;