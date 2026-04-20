const { body } = require("express-validator");

const upsertStudentValidator = [
  body("nim").notEmpty().withMessage("NIM is required"),
  body("name").notEmpty().withMessage("Name is required"),
  body("className").notEmpty().withMessage("Class name is required"),
  body("studyProgramId")
    .notEmpty()
    .withMessage("Study program id is required")
    .bail()
    .isInt()
    .withMessage("Study program id must be an integer")
    .toInt(),
  body("dosenWaliId")
    .notEmpty()
    .withMessage("Dosen wali id is required")
    .bail()
    .isInt()
    .withMessage("Dosen wali id must be an integer")
    .toInt(),
  body("sks")
    .optional({ nullable: true })
    .isInt()
    .withMessage("SKS must be an integer")
    .toInt(),
  body("ipk")
    .optional({ nullable: true })
    .isFloat()
    .withMessage("IPK must be an float")
    .toFloat(),
  body("tak")
    .optional({ nullable: true })
    .isInt()
    .withMessage("TAK must be an integer")
    .toInt(),
];

module.exports = { upsertStudentValidator };
