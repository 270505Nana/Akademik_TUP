const { body } = require("express-validator");

const upsertStudentValidator = [
  body("nim").notEmpty().withMessage("NIM wajib diisi"),
  body("name").notEmpty().withMessage("Nama wajib diisi"),
  body("className").notEmpty().withMessage("Nama kelas wajib diisi"),
  body("year")
    .notEmpty()
    .withMessage("Tahun angkatan wajib diisi")
    .bail()
    .isInt()
    .withMessage("Tahun angkatan harus berupa integer")
    .toInt(),
  body("studyProgramId")
    .notEmpty()
    .withMessage("ID program studi wajib diisi")
    .bail()
    .isInt()
    .withMessage("ID program studi harus berupa integer")
    .toInt(),
  body("dosenWaliId")
    .notEmpty()
    .withMessage("ID dosen wali wajib diisi")
    .bail()
    .isInt()
    .withMessage("ID dosen wali harus berupa integer")
    .toInt(),
  body("sks")
    .optional({ nullable: true })
    .isInt()
    .withMessage("SKS harus berupa integer")
    .toInt(),
  body("ipk")
    .optional({ nullable: true })
    .isFloat()
    .withMessage("IPK harus berupa float")
    .toFloat(),
  body("tak")
    .optional({ nullable: true })
    .isInt()
    .withMessage("TAK harus berupa integer")
    .toInt(),
];

module.exports = { upsertStudentValidator };
