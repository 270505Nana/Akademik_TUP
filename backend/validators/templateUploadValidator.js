const { body } = require("express-validator");

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const createTemplateUploadValidator = [
  body("name").notEmpty().withMessage("name wajib diisi"),
  body("slug").notEmpty().withMessage("slug wajib diisi"),
  body("templateFile").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("templateFile wajib diunggah");
    }

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("Tipe file tidak valid");
    }

    return true;
  }),
];

const updateTemplateUploadValidator = [
  body("name").notEmpty().withMessage("name wajib diisi"),
  body("slug").notEmpty().withMessage("slug wajib diisi"),
  body("templateFile").custom((value, { req }) => {
    if (!req.file) {
      return true;
    }

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("Tipe file tidak valid");
    }

    return true;
  }),
];

module.exports = {
  createTemplateUploadValidator,
  updateTemplateUploadValidator,
};
