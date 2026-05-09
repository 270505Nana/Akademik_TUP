const { body } = require("express-validator");

const createFacultyValidator = [
  body("name")
    .notEmpty()
    .withMessage("Faculty name is required")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Faculty name must be at least 3 characters")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Faculty name must not exceed 100 characters")
    .trim(),
];

const updateFacultyValidator = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Faculty name cannot be empty")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Faculty name must be at least 3 characters")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Faculty name must not exceed 100 characters")
    .trim(),
];

module.exports = {
  createFacultyValidator,
  updateFacultyValidator,
};
