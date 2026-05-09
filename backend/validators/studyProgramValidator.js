const { body } = require("express-validator");

const createStudyProgramValidator = [
  body("name")
    .notEmpty()
    .withMessage("Study program name is required")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Study program name must be at least 3 characters")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Study program name must not exceed 100 characters")
    .trim(),
  body("facultyId")
    .notEmpty()
    .withMessage("Faculty ID is required")
    .bail()
    .isInt()
    .withMessage("Faculty ID must be an integer")
    .toInt(),
];

const updateStudyProgramValidator = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Study program name cannot be empty")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Study program name must be at least 3 characters")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Study program name must not exceed 100 characters")
    .trim(),
  body("facultyId")
    .optional()
    .notEmpty()
    .withMessage("Faculty ID cannot be empty")
    .bail()
    .isInt()
    .withMessage("Faculty ID must be an integer")
    .toInt(),
];

module.exports = {
  createStudyProgramValidator,
  updateStudyProgramValidator,
};
