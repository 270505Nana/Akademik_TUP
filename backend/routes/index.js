var express = require("express");

var router = express.Router();

const {
  downloadTemplateUpload,
  previewTemplateUpload,
} = require("../controllers/templateUploadController");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// Download Templetes
router.get("/templates/download/:slug", downloadTemplateUpload);

// Preview Templates
router.get("/templates/preview/:slug", previewTemplateUpload);

module.exports = router;
