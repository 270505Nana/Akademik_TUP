const { body } = require("express-validator");

const createSidangRegistrationValidator = [
  body("programType")
    .notEmpty()
    .withMessage("Program type is required")
    .isString()
    .withMessage("Program type must be a string"),

  body("sidangScheme")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Sidang scheme must be an array if provided"),

  body("sks")
    .notEmpty()
    .withMessage("SKS is required")
    .bail()
    .isInt()
    .withMessage("SKS must be an integer")
    .toInt(),

  body("ipk")
    .notEmpty()
    .withMessage("IPK is required")
    .bail()
    .isFloat()
    .withMessage("IPK must be a float")
    .toFloat(),

  body("tak")
    .notEmpty()
    .withMessage("TAK is required")
    .bail()
    .isInt()
    .withMessage("TAK must be an integer")
    .toInt(),

  body("sktaExpDate")
    .notEmpty()
    .withMessage("SKTA exp date is required")
    .isISO8601()
    .withMessage("SKTA exp date must be a valid date (ISO 8601 format)"),

  body("thesisTitleId")
    .notEmpty()
    .withMessage("Thesis title ID is required")
    .isString()
    .withMessage("Thesis title ID must be a string"),

  body("thesisTitleEn")
    .notEmpty()
    .withMessage("Thesis title EN is required")
    .isString()
    .withMessage("Thesis title EN must be a string"),

  body("studentId")
    .notEmpty()
    .withMessage("Student ID is required")
    .bail()
    .isInt()
    .withMessage("Student ID must be an integer")
    .toInt(),

  body("dosenPembimbing1Id")
    .notEmpty()
    .withMessage("Dosen pembimbing 1 ID is required")
    .bail()
    .isInt()
    .withMessage("Dosen pembimbing 1 ID must be an integer")
    .toInt(),

  body("dosenPembimbing2Id")
    .notEmpty()
    .withMessage("Dosen pembimbing 2 ID is required")
    .bail()
    .isInt()
    .withMessage("Dosen pembimbing 2 ID must be an integer")
    .toInt(),
];

const updateSidangRegistrationValidator = [
  body("programType")
    .optional()
    .isString()
    .withMessage("Program type must be a string"),

  body("sidangScheme")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Sidang scheme must be an array if provided"),

  body("sks").optional().isInt().withMessage("SKS must be an integer").toInt(),

  body("ipk").optional().isFloat().withMessage("IPK must be a float").toFloat(),

  body("tak").optional().isInt().withMessage("TAK must be an integer").toInt(),

  body("sktaExpDate")
    .optional()
    .isISO8601()
    .withMessage("SKTA exp date must be a valid date (ISO 8601 format)"),

  body("thesisTitleId")
    .optional()
    .isString()
    .withMessage("Thesis title ID must be a string"),

  body("thesisTitleEn")
    .optional()
    .isString()
    .withMessage("Thesis title EN must be a string"),

  body("studentId")
    .optional()
    .isInt()
    .withMessage("Student ID must be an integer")
    .toInt(),

  body("dosenPembimbing1Id")
    .optional()
    .isInt()
    .withMessage("Dosen pembimbing 1 ID must be an integer")
    .toInt(),

  body("dosenPembimbing2Id")
    .optional()
    .isInt()
    .withMessage("Dosen pembimbing 2 ID must be an integer")
    .toInt(),
];

module.exports = {
  createSidangRegistrationValidator,
  updateSidangRegistrationValidator,
};
