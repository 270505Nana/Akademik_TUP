const { body } = require("express-validator");

const allowedMimeTypes = ["application/pdf"];

const createTranskripUploadValidator = [
  body("name").notEmpty().withMessage("name wajib diisi"),
  body("studentId")
    .notEmpty()
    .withMessage("studentId wajib diisi")
    .isInt()
    .withMessage("studentId harus berupa integer")
    .toInt(),
  body("transkripFile").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("transkripFile wajib diunggah");
    }

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("Tipe file tidak valid (hanya diperbolehkan PDF)");
    }

    return true;
  }),
];

const updateTranskripUploadValidator = [
  body("name").optional().notEmpty().withMessage("name tidak boleh kosong jika diisi"),
  body("studentId")
    .optional()
    .isInt()
    .withMessage("studentId harus berupa integer")
    .toInt(),
  body("transkripFile").custom((value, { req }) => {
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
  createTranskripUploadValidator,
  updateTranskripUploadValidator,
};
