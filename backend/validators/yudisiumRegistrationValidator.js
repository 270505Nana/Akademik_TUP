const { body } = require("express-validator");

const submitYudisiumRegistrationValidator = [
  body("id")
    .notEmpty()
    .withMessage("ID is required for submission")
    .isInt()
    .withMessage("ID must be an integer")
    .toInt(),

  body("programType")
    .notEmpty()
    .withMessage("Program type is required")
    .isString()
    .withMessage("Program type must be a string"),

  body("tak")
    .notEmpty()
    .withMessage("TAK is required")
    .bail()
    .isInt()
    .withMessage("TAK must be an integer")
    .toInt(),

  body("thesisTitleId")
    .notEmpty()
    .withMessage("Thesis title ID is required")
    .isString()
    .withMessage("Thesis title ID must be a string"),

  body("thesisTitleEn")
    .notEmpty()
    .withMessage("Thesis title EN is required")
    .isString()
    .withMessage("Thesis title EN must be a string"),

  body("isConfirmed")
    .notEmpty()
    .withMessage("Confirmation is required")
    .isBoolean()
    .withMessage("Confirmation must be a boolean")
    .toBoolean(),

  body("studentId")
    .notEmpty()
    .withMessage("Student ID is required")
    .bail()
    .isInt()
    .withMessage("Student ID must be an integer")
    .toInt(),

  body("dosenPembimbing1Id")
    .notEmpty()
    .withMessage("Dosen pembimbing 1 ID is required")
    .bail()
    .isInt()
    .withMessage("Dosen pembimbing 1 ID must be an integer")
    .toInt(),

  body("dosenPembimbing2Id")
    .notEmpty()
    .withMessage("Dosen pembimbing 2 ID is required")
    .bail()
    .isInt()
    .withMessage("Dosen pembimbing 2 ID must be an integer")
    .toInt(),

  body("sidangScheme")
    .optional({ nullable: true })
    .isString()
    .withMessage("Sidang scheme must be a string if provided"),

  body("cumlaudeScheme")
    .optional({ nullable: true })
    .isString()
    .withMessage("Cumlaude scheme must be a string if provided"),

  body("jalurNonYudisium")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Jalur non yudisium must be an array if provided"),

  body("eviden_cumlaude")
    .optional({ nullable: true })
    .isString()
    .withMessage("Eviden cumlaude must be a string"),

  body("yudisiumPeriodId")
    .optional({ nullable: true })
    .isInt()
    .withMessage("Yudisium period ID must be an integer")
    .toInt(),

  body("yudisiumRegistrationPeriodId")
    .optional({ nullable: true })
    .isInt()
    .withMessage("Yudisium registration period ID must be an integer")
    .toInt(),
];

const saveYudisiumRegistrationValidator = [
  body("id")
    .optional({ nullable: true })
    .isInt()
    .withMessage("ID must be an integer")
    .toInt(),

  body("programType")
    .optional({ nullable: true })
    .isString()
    .withMessage("Program type must be a string"),

  body("tak")
    .optional({ nullable: true })
    .isInt()
    .withMessage("TAK must be an integer")
    .toInt(),

  body("thesisTitleId")
    .optional({ nullable: true })
    .isString()
    .withMessage("Thesis title ID must be a string"),

  body("thesisTitleEn")
    .optional({ nullable: true })
    .isString()
    .withMessage("Thesis title EN must be a string"),

  body("isConfirmed")
    .optional({ nullable: true })
    .isBoolean()
    .withMessage("Confirmation must be a boolean")
    .toBoolean(),

  body("sidangScheme")
    .optional({ nullable: true })
    .isString()
    .withMessage("Sidang scheme must be a string if provided"),

  body("cumlaudeScheme")
    .optional({ nullable: true })
    .isString()
    .withMessage("Cumlaude scheme must be a string if provided"),

  body("jalurNonYudisium")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Jalur non yudisium must be an array if provided"),

  body("eviden_cumlaude")
    .optional({ nullable: true })
    .isString()
    .withMessage("Eviden cumlaude must be a string"),

  body("studentId")
    .optional({ nullable: true })
    .isInt()
    .withMessage("Student ID must be an integer")
    .toInt(),

  body("dosenPembimbing1Id")
    .optional({ nullable: true })
    .isInt()
    .withMessage("Dosen pembimbing 1 ID must be an integer")
    .toInt(),

  body("dosenPembimbing2Id")
    .optional({ nullable: true })
    .isInt()
    .withMessage("Dosen pembimbing 2 ID must be an integer")
    .toInt(),

  body("yudisiumPeriodId")
    .optional({ nullable: true })
    .isInt()
    .withMessage("Yudisium period ID must be an integer")
    .toInt(),

  body("yudisiumRegistrationPeriodId")
    .optional({ nullable: true })
    .isInt()
    .withMessage("Yudisium registration period ID must be an integer")
    .toInt(),
];

module.exports = {
  saveYudisiumRegistrationValidator,
  submitYudisiumRegistrationValidator,
};
