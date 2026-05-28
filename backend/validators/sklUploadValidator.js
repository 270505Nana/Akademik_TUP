const { body } = require("express-validator");

const allowedMimeTypes = ["application/pdf"];

const createSklUploadValidator = [
  body("name").notEmpty().withMessage("name wajib diisi"),
  body("studentId")
    .notEmpty()
    .withMessage("studentId wajib diisi")
    .isInt()
    .withMessage("studentId harus berupa integer")
    .toInt(),
  body("sklFile").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("sklFile wajib diunggah");
    }

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("Tipe file tidak valid (hanya diperbolehkan PDF)");
    }

    return true;
  }),
];

const updateSklUploadValidator = [
  body("name").optional().notEmpty().withMessage("name tidak boleh kosong jika diisi"),
  body("studentId")
    .optional()
    .isInt()
    .withMessage("studentId harus berupa integer")
    .toInt(),
  body("sklFile").custom((value, { req }) => {
    if (!req.file) {
      return true;
    }

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("Tipe file tidak valid (hanya diperbolehkan PDF)");
    }

    return true;
  }),
];

module.exports = {
  createSklUploadValidator,
  updateSklUploadValidator,
};
