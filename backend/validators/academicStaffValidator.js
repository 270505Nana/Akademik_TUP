const { body } = require("express-validator");

const upsertAcademicStaffValidator = [
  body("name").notEmpty().withMessage("Nama wajib diisi"),
];

module.exports = { upsertAcademicStaffValidator };
