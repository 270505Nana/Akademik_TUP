var express = require("express");
const { verifyToken } = require("../middlewares/auth");
const {
  downloadTemplateUpload,
} = require("../controllers/templateUploadController");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// Download Templetes
router.get("/templates/download/:slug", downloadTemplateUpload);

module.exports = router;
