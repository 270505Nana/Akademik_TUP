const { body } = require("express-validator");

const allowedMimeTypes = ["application/pdf"];

const createDokumenValidasiSktaUploadValidator = [
  body("name").notEmpty().withMessage("name wajib diisi"),
  body("studentId")
    .notEmpty()
    .withMessage("studentId wajib diisi")
    .isInt()
    .withMessage("studentId harus berupa integer")
    .toInt(),
  body("dokumenFile").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("dokumenFile wajib diunggah");
    }

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("Tipe file tidak valid (hanya diperbolehkan PDF)");
    }

    return true;
  }),
];

const updateDokumenValidasiSktaUploadValidator = [
  body("name").optional().notEmpty().withMessage("name tidak boleh kosong jika diisi"),
  body("studentId")
    .optional()
    .isInt()
    .withMessage("studentId harus berupa integer")
    .toInt(),
  body("dokumenFile").custom((value, { req }) => {
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
  createDokumenValidasiSktaUploadValidator,
  updateDokumenValidasiSktaUploadValidator,
};
