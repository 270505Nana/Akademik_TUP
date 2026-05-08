const { body } = require("express-validator");

const allowedMimeTypes = ["application/pdf"];

const validateRequiredPdfFile = (fieldName) =>
  body(fieldName).custom((value, { req }) => {
    const file = req.files?.[fieldName]?.[0];

    if (!file) {
      throw new Error(`${fieldName} file is required`);
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error("invalid file type");
    }

    return true;
  });

const createSktaRequestValidator = [
  body("proposalTitleId").notEmpty().withMessage("proposalTitleId is required"),
  body("proposalTitleEn").notEmpty().withMessage("proposalTitleEn is required"),
  body("studentId")
    .notEmpty()
    .isInt()
    .withMessage("studentId is required")
    .toInt(),
  body("dosenPembimbing1Id")
    .notEmpty()
    .isInt()
    .withMessage("dosenPembimbing1Id is required")
    .toInt(),
  body("dosenPembimbing2Id")
    .notEmpty()
    .isInt()
    .withMessage("dosenPembimbing2Id is required")
    .toInt(),
  validateRequiredPdfFile("evidence"),
  validateRequiredPdfFile("evidenceIgracias"),
];

const updateSktaRequestValidator = [...createSktaRequestValidator];

module.exports = {
  createSktaRequestValidator,
  updateSktaRequestValidator,
};
