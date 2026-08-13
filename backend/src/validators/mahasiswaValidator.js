import { body } from 'express-validator';

const upsertMahasiswaValidator = [
  body("nim").notEmpty().withMessage("NIM wajib diisi"),
  body("name").notEmpty().withMessage("Nama wajib diisi"),
  body("className").optional().notEmpty().withMessage("Nama kelas wajib diisi"),
  body("kelasAsal").optional().notEmpty().withMessage("Nama kelas wajib diisi"),
  body("year").optional().isInt().withMessage("Tahun angkatan harus berupa integer").toInt(),
  body("tahunAngkatan").optional().isInt().withMessage("Tahun angkatan harus berupa integer").toInt(),
  body("studyProgramId").notEmpty().withMessage("ID program studi wajib diisi"),
  body("dosenWaliId").notEmpty().withMessage("ID dosen wali wajib diisi"),
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

export { upsertMahasiswaValidator };
