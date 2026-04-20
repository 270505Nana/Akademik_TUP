const { body } = require("express-validator");

const upsertLecturerValidator = [
  body("nip").notEmpty().withMessage("NIP is required"),
  body("nidn").notEmpty().withMessage("NIDN is required"),
  body("lecturerCode")
    .notEmpty()
    .withMessage("Lecturer code (kode dosen) is required"),
  body("name").notEmpty().withMessage("Name is required"),
  body("researchGroupId")
    .notEmpty()
    .withMessage("Research group id is required"),
];

module.exports = { upsertLecturerValidator };
