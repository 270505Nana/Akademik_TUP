import { body } from 'express-validator';

const allowedMimeTypes = ["application/pdf"];

const createTranskripUploadValidator = [
  body("name").notEmpty().withMessage("name wajib diisi"),
  body("mahasiswaId")
    .notEmpty()
    .withMessage("mahasiswaId wajib diisi")
    .isInt()
    .withMessage("mahasiswaId harus berupa integer")
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
  body("mahasiswaId")
    .optional()
    .isInt()
    .withMessage("mahasiswaId harus berupa integer")
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

export { createTranskripUploadValidator,
  updateTranskripUploadValidator, };
