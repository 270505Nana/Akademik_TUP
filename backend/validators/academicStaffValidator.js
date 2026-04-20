const { body } = require("express-validator");

const upsertAcademicStaffValidator = [
  body("name").notEmpty().withMessage("Name is required"),
];

module.exports = { upsertAcademicStaffValidator };
