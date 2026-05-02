const { body } = require("express-validator");

const createSidangRegistrationPeriodValidator = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid date (ISO 8601 format)")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Start date cannot be in the past");
      }
      return true;
    }),

  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("End date must be a valid date (ISO 8601 format)")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("isOpen").optional().isBoolean().withMessage("isOpen must be a boolean"),
];

const updateSidangRegistrationPeriodValidator = [
  body("name").optional().isString().withMessage("Name must be a string"),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date (ISO 8601 format)")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Start date cannot be in the past");
      }
      return true;
    }),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date (ISO 8601 format)")
    .custom((value, { req }) => {
      const startDate = req.body.startDate || req.body.existingStartDate;
      if (new Date(value) <= new Date(startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("isOpen").optional().isBoolean().withMessage("isOpen must be a boolean"),
];

module.exports = {
  createSidangRegistrationPeriodValidator,
  updateSidangRegistrationPeriodValidator,
};
