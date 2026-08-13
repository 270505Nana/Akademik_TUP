import { body } from 'express-validator';

const upsertDosenValidator = [
  body("nip").notEmpty().withMessage("NIP wajib diisi"),
  body("nidn").optional({ nullable: true }),
  body("name").notEmpty().withMessage("Nama wajib diisi"),
  body("researchGroupId").notEmpty().withMessage("ID kelompok riset wajib diisi"),
  body("kodeDosen").optional().notEmpty().withMessage("Kode dosen wajib diisi"),
  body("lecturerCode").optional().notEmpty().withMessage("Kode dosen wajib diisi"),
];

export { upsertDosenValidator };
