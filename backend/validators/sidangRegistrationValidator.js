const { body } = require("express-validator");

const submitSidangRegistrationValidator = [
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

  body("sidangScheme").optional({ nullable: true }),
  // .isArray()
  // .withMessage("Skema sidang harus berupa array jika diisi")

  body("jalurNonSidang")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Jalur non sidang harus berupa array jika diisi"),

  body("sks")
    .notEmpty()
    .withMessage("SKS wajib diisi")
    .bail()
    .isInt()
    .withMessage("SKS harus berupa integer")
    .toInt(),

  body("ipk")
    .notEmpty()
    .withMessage("IPK wajib diisi")
    .bail()
    .isFloat()
    .withMessage("IPK harus berupa float")
    .toFloat(),

  body("tak")
    .notEmpty()
    .withMessage("TAK wajib diisi")
    .bail()
    .isInt()
    .withMessage("TAK harus berupa integer")
    .toInt(),

  body("sktaExpDate")
    .notEmpty()
    .withMessage("Tanggal berlaku SKTA wajib diisi")
    .isISO8601()
    .withMessage(
      "Tanggal berlaku SKTA harus berupa tanggal yang valid (format ISO 8601)",
    ),

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
];

const saveSidangRegistrationValidator = [
  body("id")
    .optional({ nullable: true })
    .isInt()
    .withMessage("ID harus berupa integer")
    .toInt(),

  body("programType")
    .optional({ nullable: true })
    .isString()
    .withMessage("Tipe program harus berupa string"),

  body("sidangScheme").optional({ nullable: true }),
  // .isArray()
  // .withMessage("Skema sidang harus berupa array jika diisi"),

  body("jalurNonSidang")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Jalur non sidang harus berupa array jika diisi"),

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

  body("sktaExpDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage(
      "Tanggal berlaku SKTA harus berupa tanggal yang valid (format ISO 8601)",
    ),

  body("thesisTitleId")
    .optional({ nullable: true })
    .isString()
    .withMessage("Judul TA (ID) harus berupa string"),

  body("thesisTitleEn")
    .optional({ nullable: true })
    .isString()
    .withMessage("Judul TA (EN) harus berupa string"),

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
];

module.exports = {
  saveSidangRegistrationValidator,
  submitSidangRegistrationValidator,
};
