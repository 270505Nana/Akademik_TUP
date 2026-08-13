import { body } from 'express-validator';

const upsertAcademicStaffValidator = [
  body("name").notEmpty().withMessage("Nama wajib diisi"),
];

export { upsertAcademicStaffValidator };
