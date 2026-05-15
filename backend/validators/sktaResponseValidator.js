const { body } = require("express-validator");

const sktaResponseBodyValidator = [
  body("hasUploadedFinalProposal")
    .notEmpty()
    .withMessage("hasUploadedFinalProposal wajib diisi")
    .bail()
    .isBoolean()
    .withMessage("hasUploadedFinalProposal harus berupa boolean")
    .toBoolean(),
  body("hasTakenLanguageTest")
    .notEmpty()
    .withMessage("hasTakenLanguageTest wajib diisi")
    .bail()
    .isBoolean()
    .withMessage("hasTakenLanguageTest harus berupa boolean")
    .toBoolean(),
  body("message")
    .optional({ nullable: true })
    .isString()
    .withMessage("message harus berupa string"),
  body("expDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("expDate harus berupa tanggal yang valid")
    .toDate(),
  body("academicStaffId")
    .notEmpty()
    .withMessage("academicStaffId wajib diisi")
    .bail()
    .isInt()
    .withMessage("academicStaffId harus berupa integer")
    .toInt(),
  body("sktaRequestId")
    .notEmpty()
    .withMessage("sktaRequestId wajib diisi")
    .bail()
    .isInt()
    .withMessage("sktaRequestId harus berupa integer")
    .toInt(),
  body("sktaFile").custom((value, { req }) => {
    if (!req.file) {
      return true;
    }

    const allowedMimeTypes = ["application/pdf"];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("Tipe file tidak valid");
    }

    return true;
  }),
];

const createSktaResponsetValidator = [...sktaResponseBodyValidator];
const updateSktaResponsetValidator = [...sktaResponseBodyValidator];

module.exports = { createSktaResponsetValidator, updateSktaResponsetValidator };
