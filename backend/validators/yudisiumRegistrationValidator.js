const { body } = require("express-validator");

const submitYudisiumRegistrationValidator = [
  body("id")
    .notEmpty()
    .withMessage("ID wajib diisi untuk submit")
    .isInt()
    .withMessage("ID harus berupa integer")
    .toInt(),

  body("programType")
    .notEmpty()
    .withMessage("Tipe program wajib diisi")
    .isString()
    .withMessage("Tipe program harus berupa string"),

  body("tak")
    .notEmpty()
    .withMessage("TAK wajib diisi")
    .bail()
    .isInt()
    .withMessage("TAK harus berupa integer")
    .toInt(),

  body("thesisTitleId")
    .notEmpty()
    .withMessage("Judul TA (ID) wajib diisi")
    .isString()
    .withMessage("Judul TA (ID) harus berupa string"),

  body("thesisTitleEn")
    .notEmpty()
    .withMessage("Judul TA (EN) wajib diisi")
    .isString()
    .withMessage("Judul TA (EN) harus berupa string"),

  body("isConfirmed")
    .notEmpty()
    .withMessage("Konfirmasi wajib diisi")
    .isBoolean()
    .withMessage("Konfirmasi harus berupa boolean")
    .toBoolean(),

  body("studentId")
    .notEmpty()
    .withMessage("ID mahasiswa wajib diisi")
    .bail()
    .isInt()
    .withMessage("ID mahasiswa harus berupa integer")
    .toInt(),

  body("dosenPembimbing1Id")
    .notEmpty()
    .withMessage("ID dosen pembimbing 1 wajib diisi")
    .bail()
    .isInt()
    .withMessage("ID dosen pembimbing 1 harus berupa integer")
    .toInt(),

  body("dosenPembimbing2Id")
    .notEmpty()
    .withMessage("ID dosen pembimbing 2 wajib diisi")
    .bail()
    .isInt()
    .withMessage("ID dosen pembimbing 2 harus berupa integer")
    .toInt(),

  body("sidangScheme")
    .optional({ nullable: true })
    .isString()
    .withMessage("Skema sidang harus berupa string jika diisi"),

  body("cumlaudeScheme")
    .optional({ nullable: true })
    .isString()
    .withMessage("Skema cumlaude harus berupa string jika diisi"),

  body("jalurNonYudisium")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Jalur non yudisium harus berupa array jika diisi"),

  body("eviden_cumlaude")
    .optional({ nullable: true })
    .isString()
    .withMessage("Eviden cumlaude harus berupa string"),

  body("yudisiumPeriodId")
    .optional({ nullable: true })
    .isInt()
    .withMessage("ID periode yudisium harus berupa integer")
    .toInt(),

  body("yudisiumRegistrationPeriodId")
    .optional({ nullable: true })
    .isInt()
    .withMessage("ID periode pendaftaran yudisium harus berupa integer")
    .toInt(),
];

const saveYudisiumRegistrationValidator = [
  body("id")
    .optional({ nullable: true })
    .isInt()
    .withMessage("ID harus berupa integer")
    .toInt(),

  body("programType")
    .optional({ nullable: true })
    .isString()
    .withMessage("Tipe program harus berupa string"),

  body("tak")
    .optional({ nullable: true })
    .isInt()
    .withMessage("TAK harus berupa integer")
    .toInt(),

  body("thesisTitleId")
    .optional({ nullable: true })
    .isString()
    .withMessage("Judul TA (ID) harus berupa string"),

  body("thesisTitleEn")
    .optional({ nullable: true })
    .isString()
    .withMessage("Judul TA (EN) harus berupa string"),

  body("isConfirmed")
    .optional({ nullable: true })
    .isBoolean()
    .withMessage("Konfirmasi harus berupa boolean")
    .toBoolean(),

  body("sidangScheme")
    .optional({ nullable: true })
    .isString()
    .withMessage("Skema sidang harus berupa string jika diisi"),

  body("cumlaudeScheme")
    .optional({ nullable: true })
    .isString()
    .withMessage("Skema cumlaude harus berupa string jika diisi"),

  body("jalurNonYudisium")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Jalur non yudisium harus berupa array jika diisi"),

  body("eviden_cumlaude")
    .optional({ nullable: true })
    .isString()
    .withMessage("Eviden cumlaude harus berupa string"),

  body("studentId")
    .optional({ nullable: true })
    .isInt()
    .withMessage("ID mahasiswa harus berupa integer")
    .toInt(),

  body("dosenPembimbing1Id")
    .optional({ nullable: true })
    .isInt()
    .withMessage("ID dosen pembimbing 1 harus berupa integer")
    .toInt(),

  body("dosenPembimbing2Id")
    .optional({ nullable: true })
    .isInt()
    .withMessage("ID dosen pembimbing 2 harus berupa integer")
    .toInt(),

  body("yudisiumPeriodId")
    .optional({ nullable: true })
    .isInt()
    .withMessage("ID periode yudisium harus berupa integer")
    .toInt(),

  body("yudisiumRegistrationPeriodId")
    .optional({ nullable: true })
    .isInt()
    .withMessage("ID periode pendaftaran yudisium harus berupa integer")
    .toInt(),
];

module.exports = {
  saveYudisiumRegistrationValidator,
  submitYudisiumRegistrationValidator,
};
