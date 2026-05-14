const { body } = require("express-validator");

const createYudisiumRegistrationResponseValidator = [
  body("yudisiumRegistrationId")
    .notEmpty()
    .withMessage("Yudisium registration ID is required")
    .bail()
    .isInt()
    .withMessage("Yudisium registration ID must be an integer")
    .toInt(),

  body("academicStaffId")
    .notEmpty()
    .withMessage("Academic staff ID is required")
    .bail()
    .isInt()
    .withMessage("Academic staff ID must be an integer")
    .toInt(),

  body("message")
    .optional({ nullable: true })
    .isString()
    .withMessage("Message must be a string"),

  body("isEdit")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("isEdit must be a valid date (ISO 8601 format)"),
];

const updateYudisiumRegistrationResponseValidator = [
  body("message")
    .optional({ nullable: true })
    .isString()
    .withMessage("Message must be a string"),

  body("isEdit")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("isEdit must be a valid date (ISO 8601 format)"),

  body("academicStaffId")
    .optional()
    .isInt()
    .withMessage("Academic staff ID must be an integer")
    .toInt(),

  body("yudisiumRegistrationId")
    .optional()
    .isInt()
    .withMessage("Yudisium registration ID must be an integer")
    .toInt(),
];

module.exports = {
  createYudisiumRegistrationResponseValidator,
  updateYudisiumRegistrationResponseValidator,
};
