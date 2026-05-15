const { body } = require("express-validator");

const createStudyProgramValidator = [
  body("name")
    .notEmpty()
    .withMessage("Nama program studi wajib diisi")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Nama program studi minimal 3 karakter")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Nama program studi maksimal 100 karakter")
    .trim(),
  body("facultyId")
    .notEmpty()
    .withMessage("ID fakultas wajib diisi")
    .bail()
    .isInt()
    .withMessage("ID fakultas harus berupa integer")
    .toInt(),
];

const updateStudyProgramValidator = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Nama program studi tidak boleh kosong")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Nama program studi minimal 3 karakter")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Nama program studi maksimal 100 karakter")
    .trim(),
  body("facultyId")
    .optional()
    .notEmpty()
    .withMessage("ID fakultas tidak boleh kosong")
    .bail()
    .isInt()
    .withMessage("ID fakultas harus berupa integer")
    .toInt(),
];

module.exports = {
  createStudyProgramValidator,
  updateStudyProgramValidator,
};
