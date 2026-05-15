const { body } = require("express-validator");

const upsertLecturerValidator = [
  body("nip").notEmpty().withMessage("NIP wajib diisi"),
  body("nidn").optional({ nullable: true, checkFalsy: true }),
  body("lecturerCode").notEmpty().withMessage("Kode dosen wajib diisi"),
  body("name").notEmpty().withMessage("Nama wajib diisi"),
  body("researchGroupId")
    .notEmpty()
    .withMessage("ID kelompok riset wajib diisi")
    .bail()
    .isInt()
    .withMessage("ID kelompok riset harus berupa integer")
    .toInt(),
];

module.exports = { upsertLecturerValidator };
