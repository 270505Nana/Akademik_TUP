var express = require("express");

var router = express.Router();

const {
  downloadTemplateUpload,
} = require("../controllers/templateUploadController");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// Download Templetes
router.get("/templates/download/:slug", downloadTemplateUpload);

module.exports = router;
