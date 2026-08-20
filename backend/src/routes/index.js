import express from 'express';

var router = express.Router();

import { downloadTemplateUpload,
  previewTemplateUpload, } from '../controllers/templateUploadController.js';

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// Download Templates
router.get("/templates/download/:code", downloadTemplateUpload);

// Preview Templates
router.get("/templates/preview/:code", previewTemplateUpload);

export default router;
