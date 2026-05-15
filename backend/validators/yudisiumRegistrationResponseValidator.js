const { body } = require("express-validator");

const createYudisiumRegistrationResponseValidator = [
  body("yudisiumRegistrationId")
    .notEmpty()
    .withMessage("ID pendaftaran yudisium wajib diisi")
    .bail()
    .isInt()
    .withMessage("ID pendaftaran yudisium harus berupa integer")
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

const updateYudisiumRegistrationResponseValidator = [
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

  body("yudisiumRegistrationId")
    .optional()
    .isInt()
    .withMessage("ID pendaftaran yudisium harus berupa integer")
    .toInt(),
];

module.exports = {
  createYudisiumRegistrationResponseValidator,
  updateYudisiumRegistrationResponseValidator,
};
