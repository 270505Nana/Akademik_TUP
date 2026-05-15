const { body } = require("express-validator");

const createFacultyValidator = [
  body("name")
    .notEmpty()
    .withMessage("Nama fakultas wajib diisi")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Nama fakultas minimal 3 karakter")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Nama fakultas maksimal 100 karakter")
    .trim(),
];

const updateFacultyValidator = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Nama fakultas tidak boleh kosong")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Nama fakultas minimal 3 karakter")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Nama fakultas maksimal 100 karakter")
    .trim(),
];

module.exports = {
  createFacultyValidator,
  updateFacultyValidator,
};
