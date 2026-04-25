const { body } = require("express-validator");

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
  body("evidence").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("evidence file is required");
    }

    const allowedMimeTypes = [
      "application/pdf",
      // "image/jpeg",
      // "image/png"
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("invalid file type");
    }

    return true;
  }),
];

module.exports = { createSktaRequestValidator };
