const { body } = require("express-validator");

const createSidangRegistrationResponseValidator = [
  body("sidangRegistrationId")
    .notEmpty()
    .withMessage("ID pendaftaran sidang wajib diisi")
    .bail()
    .isInt()
    .withMessage("ID pendaftaran sidang harus berupa integer")
    .toInt(),

  body("academicStaffId")
    .notEmpty()
    .withMessage("ID staf akademik wajib diisi")
    .bail()
    .isInt()
    .withMessage("ID staf akademik harus berupa integer")
    .toInt(),

  body("message")
    .optional({ nullable: true })
    .isString()
    .withMessage("Pesan harus berupa string"),

  body("isEdit")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("isEdit harus berupa tanggal yang valid (format ISO 8601)"),
];

const updateSidangRegistrationResponseValidator = [
  body("message")
    .optional({ nullable: true })
    .isString()
    .withMessage("Pesan harus berupa string"),

  body("isEdit")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("isEdit harus berupa tanggal yang valid (format ISO 8601)"),

  body("academicStaffId")
    .optional()
    .isInt()
    .withMessage("ID staf akademik harus berupa integer")
    .toInt(),

  body("sidangRegistrationId")
    .optional()
    .isInt()
    .withMessage("ID pendaftaran sidang harus berupa integer")
    .toInt(),
];

module.exports = {
  createSidangRegistrationResponseValidator,
  updateSidangRegistrationResponseValidator,
};
