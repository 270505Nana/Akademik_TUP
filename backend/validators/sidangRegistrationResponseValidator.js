const { body } = require("express-validator");

const createSidangRegistrationResponseValidator = [
  body("sidangRegistrationId")
    .notEmpty()
    .withMessage("Sidang registration ID is required")
    .bail()
    .isInt()
    .withMessage("Sidang registration ID must be an integer")
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

const updateSidangRegistrationResponseValidator = [
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

  body("sidangRegistrationId")
    .optional()
    .isInt()
    .withMessage("Sidang registration ID must be an integer")
    .toInt(),
];

module.exports = {
  createSidangRegistrationResponseValidator,
  updateSidangRegistrationResponseValidator,
};
