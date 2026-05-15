const { body } = require("express-validator");

const allowedMimeTypes = ["application/pdf"];

const validateRequiredPdfFile = (fieldName) =>
  body(fieldName).custom((value, { req }) => {
    const file = req.files?.[fieldName]?.[0];

    if (!file) {
      throw new Error(`${fieldName} wajib diunggah`);
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error("Tipe file tidak valid");
    }

    return true;
  });

const createSktaRequestValidator = [
  body("proposalTitleId").notEmpty().withMessage("proposalTitleId wajib diisi"),
  body("proposalTitleEn").notEmpty().withMessage("proposalTitleEn wajib diisi"),
  body("studentId")
    .notEmpty()
    .isInt()
    .withMessage("studentId wajib diisi")
    .toInt(),
  body("dosenPembimbing1Id")
    .notEmpty()
    .isInt()
    .withMessage("dosenPembimbing1Id wajib diisi")
    .toInt(),
  body("dosenPembimbing2Id")
    .notEmpty()
    .isInt()
    .withMessage("dosenPembimbing2Id wajib diisi")
    .toInt(),
  validateRequiredPdfFile("evidence"),
];

const updateSktaRequestValidator = [...createSktaRequestValidator];

module.exports = {
  createSktaRequestValidator,
  updateSktaRequestValidator,
};
