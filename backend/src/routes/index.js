import express from 'express';

var router = express.Router();

import { downloadTemplateUpload,
  previewTemplateUpload, } from '../controllers/templateUploadController.js';

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// Download Templetes
router.get("/templates/download/:slug", downloadTemplateUpload);

// Preview Templates
router.get("/templates/preview/:slug", previewTemplateUpload);

export default router;
