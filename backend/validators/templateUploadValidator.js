const { body } = require("express-validator");

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const createTemplateUploadValidator = [
  body("name").notEmpty().withMessage("name is required"),
  body("slug").notEmpty().withMessage("slug is required"),
  body("templateFile").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("templateFile is required");
    }

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("invalid file type");
    }

    return true;
  }),
];

const updateTemplateUploadValidator = [
  body("name").notEmpty().withMessage("name is required"),
  body("slug").notEmpty().withMessage("slug is required"),
  body("templateFile").custom((value, { req }) => {
    if (!req.file) {
      return true;
    }

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("invalid file type");
    }

    return true;
  }),
];

module.exports = {
  createTemplateUploadValidator,
  updateTemplateUploadValidator,
};
